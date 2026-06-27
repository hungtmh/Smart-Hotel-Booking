import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Modal dat phong hien ra khi nhan "Dat phong ngay".
 * Props:
 *   - room: object phong (tu SearchPage)
 *   - onClose: callback dong modal
 *   - onSuccess: callback khi dat phong thanh cong
 */
export default function BookingModal({ room, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState('');
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tinh so dem va tong tien
  const numNights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;
  const totalAmount = numNights * (room?.basePrice || 0);

  // Min checkOut = checkIn + 1 ngay
  const minCheckOut = checkIn
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0]
    : tomorrow;

  // Reset checkOut khi checkIn thay doi neu checkOut <= checkIn
  useEffect(() => {
    if (checkOut && checkOut <= checkIn) {
      setCheckOut('');
    }
  }, [checkIn]);

  // Dong modal khi nhan ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!checkOut) {
      setError('Vui lòng chọn ngày check-out.');
      return;
    }
    if (numNights <= 0) {
      setError('Ngày check-out phải sau ngày check-in.');
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
        onSuccess(data); // Tra du lieu booking ve SearchPage
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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>Xác nhận đặt phòng</h2>
            <p className="modal-subtitle">{room.name} — {room.hotel?.name}</p>
          </div>
          <button id="modal-close-btn" className="modal-close-btn" onClick={onClose}>✕</button>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Dates */}
          <div className="modal-dates-row">
            <div className="filter-group">
              <label htmlFor="booking-checkin">Ngày Check-in</label>
              <input
                id="booking-checkin"
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>
            <div className="filter-group">
              <label htmlFor="booking-checkout">Ngày Check-out</label>
              <input
                id="booking-checkout"
                type="date"
                value={checkOut}
                min={minCheckOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>
          </div>

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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
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
      </div>
    </div>
  );
}
