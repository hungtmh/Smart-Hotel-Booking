import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// ============================================================================
// CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN (SEPAY / VIETQR)
// Bạn chỉ cần thay đổi 3 thông số này thành tài khoản thật của bạn để khi quét QR
// ứng dụng ngân hàng sẽ nhận diện chính xác tên bạn:
// ============================================================================
export const BANK_CONFIG = {
  BANK_ID: 'VietinBank',          // Mã ngân hàng: MBBank, Vietcombank, Techcombank, VPBank, BIDV, ACB, TPBank...
  BANK_NAME: 'VietinBank (Ngân hàng Công Thương Việt Nam)', // Tên hiển thị trên giao diện
  ACCOUNT_NO: '108879632507',   // <--- THAY SỐ TÀI KHOẢN THẬT CỦA BẠN VÀO ĐÂY
  ACCOUNT_NAME: 'KHÁCH SẠN SMART HOTEL' // <--- THAY TÊN CHỦ TÀI KHOẢN CỦA BẠN VÀO ĐÂY (Vd: NGUYEN VAN A)
};

/**
 * Modal dat phong hien ra khi nhan "Dat phong ngay".
 * Props:
 *   - room: object phong (tu SearchPage)
 *   - onClose: callback dong modal
 *   - onSuccess: callback khi dat phong thanh cong
 */
export default function BookingModal({ room, onClose, onSuccess }) {
  const toDateTimeLocalValue = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const parseDateTimeLocalValue = (value) => {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    if (!datePart || !timePart) return null;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const parsed = new Date(year, month - 1, day, hour, minute);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const getDatePart = (value) => value ? value.split('T')[0] : '';
  const getNextDayStartValue = (value) => {
    const date = parseDateTimeLocalValue(value);
    if (!date) return toDateTimeLocalValue(defaultCheckOutDate);
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return toDateTimeLocalValue(date);
  };
  const calculateBillableNights = (checkInValue, checkOutValue) => {
    const checkInDate = parseDateTimeLocalValue(checkInValue);
    const checkOutDate = parseDateTimeLocalValue(checkOutValue);
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) return 0;

    const checkInDay = Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const checkOutDay = Date.UTC(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    const dayDiff = Math.floor((checkOutDay - checkInDay) / 86400000);
    const lateCheckoutNight = checkOutDate.getHours() > 12
      || (checkOutDate.getHours() === 12 && checkOutDate.getMinutes() > 0);

    return Math.max(1, dayDiff + (lateCheckoutNight ? 1 : 0));
  };
  const now = new Date();
  const minCheckInDateTime = toDateTimeLocalValue(now);
  const defaultCheckInDate = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultCheckOutDate = new Date(defaultCheckInDate.getTime() + 24 * 60 * 60 * 1000);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho cac buoc: 1 = Form dat phong, 2 = Quet QR SePay & Polling, 3 = Thanh cong
  const [step, setStep] = useState(1);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  const checkInDate = parseDateTimeLocalValue(checkIn);
  const checkOutDate = parseDateTimeLocalValue(checkOut);
  // So sánh chỉ theo NGÀY (bỏ qua giờ)
  const checkInDateOnly = checkIn ? getDatePart(checkIn) : '';
  const checkOutDateOnly = checkOut ? getDatePart(checkOut) : '';
  const validationMessage = !checkIn
    ? 'Vui lòng chọn thời điểm check-in.'
    : !checkInDate || checkInDate <= now
      ? 'Thời điểm check-in phải sau thời điểm hiện tại.'
      : !checkOut
        ? 'Vui lòng chọn thời điểm check-out.'
        : !checkOutDate || checkOutDateOnly <= checkInDateOnly
          ? 'Ngày check-out phải sau ngày check-in (không được trùng ngày).'
          : '';
  const isCheckInInvalid = Boolean(checkIn) && (!checkInDate || checkInDate <= now);
  const isCheckOutInvalid = Boolean(checkOut) && (!checkOutDate || (checkInDateOnly && checkOutDateOnly <= checkInDateOnly));
  const shouldShowValidation = Boolean(checkIn || checkOut);

  // Tinh so dem va tong tien
  const numNights = validationMessage ? 0 : calculateBillableNights(checkIn, checkOut);
  const totalAmount = numNights * (room?.basePrice || 0);

  // Min checkOut = ngay sau ngay check-in luc 00:00.
  const minCheckOut = checkIn
    ? getNextDayStartValue(checkIn)
    : toDateTimeLocalValue(defaultCheckOutDate);

  // Ham xu ly dong modal an toan
  const handleCloseModal = () => {
    if (createdBooking) {
      onSuccess(createdBooking);
    } else {
      onClose();
    }
  };

  // Dong modal khi nhan ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleCloseModal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [createdBooking, onClose, onSuccess]);

  // Polling trang thai thanh toan tai buoc 2 (moi 3 giay)
  useEffect(() => {
    if (step !== 2 || !createdBooking) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/public/payment/status/${createdBooking.bookingId}`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.isPaid) {
            setCreatedBooking((prev) => ({ ...prev, status: statusData.status }));
            setStep(3); // Chuyen sang buoc Thanh cong
          }
        }
      } catch (err) {
        console.error('Loi khi polling trang thai thanh toan:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, createdBooking]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(''), 2500);
  };

  // Gia lap thanh toan nhanh ngay tren web (cho do an)
  const handleDemoBypass = async () => {
    if (!createdBooking) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/public/payment/confirm/${createdBooking.bookingId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedBooking((prev) => ({ ...prev, status: data.status || 'CONFIRMED' }));
        setStep(3);
      } else {
        setError('Không thể xác nhận thanh toán demo.');
      }
    } catch (err) {
      setError('Lỗi kết nối khi gọi API ByPass.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const res = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomTypeId: room.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numAdults: parseInt(numAdults),
          numChildren: parseInt(numChildren),
          specialRequests: specialRequests.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Thay vi dong modal ngay, chuyen sang buoc 2: Thanh toan VietQR SePay
        setCreatedBooking(data);
        setStep(2);
      } else {
        setError(data.message || 'Có lỗi xảy ra khi đặt phòng.');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>
              {step === 1 && 'Xác nhận đặt phòng'}
              {step === 2 && 'Thanh toán chuyển khoản VietQR'}
              {step === 3 && 'Đặt phòng hoàn tất'}
            </h2>
            <p className="modal-subtitle">{room.name} — {room.hotel?.name}</p>
          </div>
          <button id="modal-close-btn" className="modal-close-btn" onClick={handleCloseModal}>✕</button>
        </div>

        {/* Room summary */}
        <div className="modal-room-preview">
          <img
            src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400'}
            alt={room.name}
            className="modal-room-img"
          />
          <div className="modal-room-info">
            <span className="hotel-city-badge">📍 {room.hotel?.city}</span>
            <span className="hotel-stars">{'★'.repeat(room.hotel?.starRating || 5)}</span>
            <div className="modal-room-price">
              {room.basePrice?.toLocaleString('vi-VN')} ₫<span>/đêm</span>
            </div>
            <div className="modal-room-capacity">
              👥 Tối đa {room.capacityAdults} NL {room.capacityChildren > 0 && `+ ${room.capacityChildren} TE`}
              &nbsp;|&nbsp; 📐 {room.areaSqm} m²
            </div>
          </div>
        </div>

        {/* Step 1: Form dat phong */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Dates */}
            <div className="modal-dates-row">
              <div className="filter-group">
                <label htmlFor="booking-checkin">🏨 Check-in</label>
                <input
                  id="booking-checkin"
                  type="datetime-local"
                  value={checkIn}
                  min={minCheckInDateTime}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    const newCheckInDate = e.target.value ? getDatePart(e.target.value) : '';
                    const currentCheckOutDate = checkOut ? getDatePart(checkOut) : '';
                    if (newCheckInDate && currentCheckOutDate && currentCheckOutDate <= newCheckInDate) {
                      setCheckOut('');
                    }
                  }}
                  className={`datetime-input${isCheckInInvalid ? ' input-invalid' : ''}`}
                  required
                />
              </div>
              <div className="filter-group">
                <label htmlFor="booking-checkout">🚪 Check-out</label>
                <input
                  id="booking-checkout"
                  type="datetime-local"
                  value={checkOut}
                  min={minCheckOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={`datetime-input${isCheckOutInvalid ? ' input-invalid' : ''}`}
                  required
                />
              </div>
            </div>
            {shouldShowValidation && validationMessage && (
              <div className="booking-validation-error">{validationMessage}</div>
            )}

            {/* Guests */}
            <div className="modal-guests-row">
              <div className="filter-group">
                <label htmlFor="booking-adults">Người lớn</label>
                <input
                  id="booking-adults"
                  type="number"
                  min="1"
                  max="10"
                  value={numAdults}
                  onChange={(e) => setNumAdults(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="booking-children">Trẻ em</label>
                <input
                  id="booking-children"
                  type="number"
                  min="0"
                  max="10"
                  value={numChildren}
                  onChange={(e) => setNumChildren(e.target.value)}
                />
              </div>
            </div>

            {/* Special requests */}
            <div className="filter-group">
              <label htmlFor="booking-requests">Ghi chú đặc biệt (tùy chọn)</label>
              <textarea
                id="booking-requests"
                placeholder="Ví dụ: Cần phòng yên tĩnh, tầng cao, giường đôi..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                className="modal-textarea"
              />
            </div>

            {/* Price summary */}
            {numNights > 0 && (
              <div className="modal-price-summary">
                <div className="price-row">
                  <span>{room.basePrice?.toLocaleString('vi-VN')} ₫ × {numNights} đêm</span>
                  <span>{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="price-row price-total">
                  <span>Tổng thanh toán</span>
                  <span className="price-total-value">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            )}

            {error && <div className="search-error-alert">{error}</div>}

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={loading}>
                Hủy bỏ
              </button>
              <button
                id="confirm-booking-btn"
                type="submit"
                className="btn-primary"
                disabled={loading || numNights <= 0}
              >
                {loading ? 'Đang xử lý...' : `Xác nhận đặt phòng`}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Quet QR SePay & Polling */}
        {step === 2 && createdBooking && (
          <div className="payment-qr-step">
            <div className="payment-qr-notice">
              ⚠️ Đơn đặt phòng <strong>#{createdBooking.bookingId?.slice(0, 8).toUpperCase()}</strong> đã được tạo với trạng thái <span className="status-badge-pending">PENDING</span>. Vui lòng thanh toán để xác nhận.
            </div>

            <div className="payment-qr-content">
              <div className="qr-image-box">
                <img
                  src={`https://qr.sepay.vn/img?acc=${BANK_CONFIG.ACCOUNT_NO}&bank=${BANK_CONFIG.BANK_ID}&amount=${createdBooking.totalAmount}&des=PAY%20${createdBooking.bookingId?.slice(0, 8).toUpperCase()}`}
                  alt="VietQR SePay"
                  className="qr-image"
                />
                <span className="qr-badge">⚡ VietQR Tự Động</span>
              </div>

              <div className="qr-info-box">
                <div className="qr-info-row">
                  <span>Ngân hàng:</span>
                  <strong>{BANK_CONFIG.BANK_NAME}</strong>
                </div>
                <div className="qr-info-row">
                  <span>Số tài khoản:</span>
                  <div className="copy-group">
                    <strong>{BANK_CONFIG.ACCOUNT_NO}</strong>
                    <button type="button" className="btn-copy" onClick={() => copyToClipboard(BANK_CONFIG.ACCOUNT_NO, 'acc')}>
                      {copySuccess === 'acc' ? '✓ Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="qr-info-row">
                  <span>Chủ tài khoản:</span>
                  <strong>{BANK_CONFIG.ACCOUNT_NAME}</strong>
                </div>
                <div className="qr-info-row">
                  <span>Số tiền:</span>
                  <strong className="qr-amount">{createdBooking.totalAmount?.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div className="qr-info-row">
                  <span>Nội dung CK:</span>
                  <div className="copy-group">
                    <strong className="qr-content-code">PAY {createdBooking.bookingId?.slice(0, 8).toUpperCase()}</strong>
                    <button type="button" className="btn-copy" onClick={() => copyToClipboard(`PAY ${createdBooking.bookingId?.slice(0, 8).toUpperCase()}`, 'des')}>
                      {copySuccess === 'des' ? '✓ Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="qr-warning">
                  💡 Nhập đúng Nội dung CK để hệ thống tự động duyệt 24/7.
                </div>
              </div>
            </div>

            {/* Polling Indicator */}
            <div className="polling-indicator">
              <div className="spinner-small"></div>
              <span>Đang chờ nhận thanh toán từ ngân hàng... (Tự động kiểm tra mỗi 3 giây)</span>
            </div>

            {/* Demo / Defense Alert Box */}
            <div className="demo-bypass-box">
              <div className="demo-bypass-title">🧪 Chế độ Đồ án / Bảo vệ Demo (Postman ByPass)</div>
              <p>Để giả lập SePay webhook xác nhận thanh toán mà không cần chuyển khoản thật, mở <strong>Postman</strong> gửi request:</p>
              <code className="postman-code">POST http://localhost:8080/api/public/payment/confirm/{createdBooking.bookingId}</code>
              <p className="demo-or">hoặc có thể test nhanh ngay tại đây:</p>
              <div className="demo-bypass-actions">
                <button
                  type="button"
                  className="btn-demo-bypass"
                  onClick={handleDemoBypass}
                  disabled={loading}
                >
                  ⚡ [Test Nhanh Đồ Án] Giả lập đã CK thành công
                </button>
              </div>
            </div>

            {error && <div className="search-error-alert">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseModal}
              >
                Thanh toán sau (Xem trong Tài khoản)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Thanh toan thanh cong */}
        {step === 3 && createdBooking && (
          <div className="payment-success-step">
            <div className="success-icon-animate">🎉</div>
            <h3>Thanh toán & Xác nhận thành công!</h3>
            <p className="success-subtitle">
              Đơn đặt phòng <strong>#{createdBooking.bookingId?.slice(0, 8).toUpperCase()}</strong> đã được chuyển sang trạng thái <span className="status-badge-confirmed">CONFIRMED</span>.
            </p>
            <div className="success-summary-box">
              <div>🏨 <strong>Phòng:</strong> {room.name} ({room.hotel?.name})</div>
              <div>📅 <strong>Check-in:</strong> {new Date(createdBooking.checkInDate).toLocaleString('vi-VN')}</div>
              <div>🚪 <strong>Check-out:</strong> {new Date(createdBooking.checkOutDate).toLocaleString('vi-VN')}</div>
              <div>💰 <strong>Đã thanh toán:</strong> {createdBooking.totalAmount?.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div className="modal-actions justify-center">
              <button
                type="button"
                className="btn-primary"
                onClick={handleCloseModal}
              >
                Hoàn tất & Xem lịch sử đặt phòng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
