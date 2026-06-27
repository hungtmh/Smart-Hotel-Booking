import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import BookingModal from '../components/BookingModal';

/**
 * Trang tim kiem phong khach san (Search & Filter Page).
 * Yeu cau nguoi dung phai dang nhap de truy cap.
 * Tim kiem thoi gian thuc (Real-time Search) bang co che debounce 300ms.
 */
export default function SearchPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Cac state cua form tim kiem
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  // Cac state quan ly du lieu & UI
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // State cho BookingModal
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Danh sach thanh pho co dinh hoac lay tu database.
  // Tuong ung voi Seed Data: Da Nang
  const cities = [
    { value: '', label: 'Tất cả thành phố' },
    { value: 'Da Nang', label: 'Đà Nẵng' },
    { value: 'Hanoi', label: 'Hà Nội' },
    { value: 'Ho Chi Minh', label: 'Hồ Chí Minh' }
  ];

  // Effect tim kiem voi co che Debounce 300ms
  useEffect(() => {
    if (!isAuthenticated) return;

    const delayDebounceFn = setTimeout(() => {
      fetchRooms();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, city, minPrice, maxPrice, capacity, isAuthenticated]);

  // Ham goi API backend
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      // Lay Session tu Supabase de lay token JWT
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      // Xay dung Query Parameters
      const queryParams = new URLSearchParams();
      if (keyword.trim()) queryParams.append('keyword', keyword.trim());
      if (city) queryParams.append('city', city);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (capacity) queryParams.append('capacity', capacity);

      const res = await fetch(`http://localhost:8080/api/rooms/search?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      } else {
        setError('Có lỗi xảy ra khi tìm kiếm phòng. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ backend.');
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mo modal dat phong
  const handleOpenModal = (room) => {
    setSelectedRoom(room);
    setBookingSuccess(null);
  };

  // Xu ly khi dat phong thanh cong
  const handleBookingSuccess = (bookingData) => {
    setSelectedRoom(null);
    setBookingSuccess(
      `🎉 Đặt phòng thành công! Mã booking: ${bookingData.bookingId?.slice(0, 8).toUpperCase()}. Kiểm tra lịch sử đặt phòng tại Tài khoản.`
    );
    setTimeout(() => setBookingSuccess(null), 8000);
  };

  // Xoa nhanh cac bo loc
  const handleClearFilters = () => {
    setKeyword('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setCapacity('');
  };

  // Trang thai dang tai auth
  if (authLoading) {
    return <div className="loading-page"><div className="spinner"></div></div>;
  }

  // Yeu cau dang nhap neu chua authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="search-page">
      <div className="search-hero">
        <div className="search-hero-content">
          <h1>Tìm kiếm phòng lý tưởng của bạn</h1>
          <p>Nhập từ khóa hoặc tùy chỉnh bộ lọc để tìm kiếm căn phòng phù hợp nhất cho kỳ nghỉ của bạn.</p>
        </div>
      </div>

      <div className="search-container">
        {/* Form Loc phia trai (Sidebar Filter) */}
        <div className="filter-sidebar">
          <div className="filter-card">
            <div className="filter-header">
              <h2>Bộ lọc tìm kiếm</h2>
              <button onClick={handleClearFilters} className="btn-clear-filters">Đặt lại</button>
            </div>

            <div className="filter-body">
              {/* Keyword */}
              <div className="filter-group">
                <label htmlFor="search-keyword">Từ khóa tìm kiếm</label>
                <div className="search-input-wrapper">
                  <input
                    id="search-keyword"
                    type="text"
                    placeholder="Tên phòng, khách sạn, mô tả..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  {keyword && (
                    <button className="clear-input-btn" onClick={() => setKeyword('')}>&times;</button>
                  )}
                </div>
              </div>

              {/* City */}
              <div className="filter-group">
                <label htmlFor="search-city">Địa điểm / Thành phố</label>
                <select
                  id="search-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <label>Khoảng giá (VND / đêm)</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Tối thiểu"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                  <span className="price-separator">-</span>
                  <input
                    type="number"
                    placeholder="Tối đa"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="filter-group">
                <label htmlFor="search-capacity">Số lượng khách tối thiểu</label>
                <input
                  id="search-capacity"
                  type="number"
                  placeholder="Ví dụ: 2 khách"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Danh sach phong phia phai */}
        <div className="results-container">
          {bookingSuccess && (
            <div className="booking-alert-toast">
              {bookingSuccess}
            </div>
          )}

          <div className="results-header">
            <p className="results-count">
              Tìm thấy <strong>{rooms.length}</strong> kết quả phù hợp
            </p>
            {loading && <span className="realtime-badge">Đang tìm kiếm...</span>}
          </div>

          {error && <div className="search-error-alert">{error}</div>}

          {rooms.length === 0 && !loading && (
            <div className="no-results-card">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy phòng phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa hoặc điều chỉnh lại các tiêu chí bộ lọc của bạn.</p>
              <button onClick={handleClearFilters} className="btn-secondary">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {/* Grid view danh sach phong */}
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card-image-wrapper">
                  <img
                    src={room.images && room.images[0] ? room.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                    alt={room.name}
                    className="room-card-image"
                    loading="lazy"
                  />
                  <div className="room-price-tag">
                    {room.basePrice ? room.basePrice.toLocaleString('vi-VN') : '0'} ₫
                    <span className="price-unit">/đêm</span>
                  </div>
                </div>

                <div className="room-card-content">
                  <div className="room-card-hotel-info">
                    <span className="hotel-city-badge">📍 {room.hotel?.city || 'Việt Nam'}</span>
                    <span className="hotel-stars">
                      {'★'.repeat(room.hotel?.starRating || 5)}
                    </span>
                  </div>
                  
                  <h3 className="room-card-title">{room.name}</h3>
                  <p className="room-card-hotel-name">{room.hotel?.name}</p>
                  
                  <p className="room-card-desc">
                    {room.description || 'Không có mô tả chi tiết cho loại phòng này.'}
                  </p>

                  <div className="room-card-specs">
                    <span className="spec-item">📐 {room.areaSqm || '0'} m²</span>
                    <span className="spec-item">👥 Sức chứa: {room.capacityAdults} NL {room.capacityChildren > 0 && `+ ${room.capacityChildren} TE`}</span>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="room-card-amenities">
                      {room.amenities.slice(0, 4).map((amenity, idx) => (
                        <span key={idx} className="amenity-tag">{amenity}</span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="amenity-tag-more">+{room.amenities.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="room-card-footer">
                    <button
                      onClick={() => handleOpenModal(room)}
                      className="btn-primary btn-book"
                    >
                      Đặt phòng ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
