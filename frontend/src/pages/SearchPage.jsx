import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import BookingModal from '../components/BookingModal';

/**
 * Trang tim kiem phong khach san (Search & Filter Page).
 * Yeu cau nguoi dung phai dang nhap de truy cap.
 * Tim kiem thoi gian thuc (Real-time Search) bang co che debounce 300ms.
 * Hỗ trợ 2 luồng tìm kiếm phổ biến:
 * 1. Tìm theo Khách sạn trước -> Chọn Khách sạn -> Xem phòng (Mặc định)
 * 2. Tìm trực tiếp theo từng Phòng
 */
export default function SearchPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Cac state cua form tim kiem
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  // Chế độ hiển thị: 'hotels' (Tìm KS trước) hoặc 'rooms' (Tìm phòng trực tiếp)
  const [viewMode, setViewMode] = useState('hotels');
  // Khách sạn đang được chọn để xem danh sách phòng
  const [selectedHotelForView, setSelectedHotelForView] = useState(null);

  // Cac state quan ly du lieu & UI
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // State cho BookingModal
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Danh sach thanh pho co dinh hoac lay tu database.
  const cities = [
    { value: '', label: 'Tất cả thành phố' },
    { value: 'Da Nang', label: 'Đà Nẵng' },
    { value: 'Hanoi', label: 'Hà Nội' },
    { value: 'Ho Chi Minh', label: 'Hồ Chí Minh' },
    { value: 'Da Lat', label: 'Đà Lạt' },
    { value: 'Nha Trang', label: 'Nha Trang' }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

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
        // Khi tải lại danh sách phòng từ API, nếu đang ở chế độ xem chi tiết KS thì cập nhật lại danh sách phòng của KS đó
        if (selectedHotelForView) {
          const updatedHotelRooms = data.filter(r => r.hotel && r.hotel.id === selectedHotelForView.id);
          if (updatedHotelRooms.length > 0) {
            setSelectedHotelForView(prev => ({
              ...prev,
              roomTypes: updatedHotelRooms
            }));
          } else {
            setSelectedHotelForView(null);
          }
        }
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

  // Gom nhóm danh sách phòng theo Khách sạn (Dành cho Kiểu 1: Tìm khách sạn trước)
  const groupedHotels = useMemo(() => {
    const map = {};
    rooms.forEach(room => {
      const h = room.hotel || {
        id: 'other',
        name: 'Khách sạn tiêu chuẩn',
        city: 'Việt Nam',
        address: 'Trung tâm',
        starRating: 4,
        description: 'Các phòng lưu trú chất lượng cao trong hệ thống.',
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000']
      };
      if (!map[h.id]) {
        map[h.id] = {
          ...h,
          minPrice: room.basePrice || 0,
          roomTypes: []
        };
      }
      map[h.id].roomTypes.push(room);
      if (room.basePrice && (room.basePrice < map[h.id].minPrice || map[h.id].minPrice === 0)) {
        map[h.id].minPrice = room.basePrice;
      }
    });
    return Object.values(map);
  }, [rooms]);

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

  if (authLoading) {
    return <div className="loading-page"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="search-page">
      <div className="search-hero">
        <div className="search-hero-content">
          <h1>Tìm kiếm kỳ nghỉ lý tưởng của bạn</h1>
          <p>Lựa chọn Khách sạn yêu thích trước, sau đó khám phá các loại phòng đa dạng với tiện nghi đẳng cấp.</p>
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
                    placeholder="Tên khách sạn, loại phòng, tiện ích..."
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
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedHotelForView(null);
                  }}
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
                <label htmlFor="search-capacity">Số lượng khách</label>
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

        {/* Danh sach phia phai */}
        <div className="results-container">
          {bookingSuccess && (
            <div className="booking-alert-toast">
              {bookingSuccess}
            </div>
          )}

          {/* Header Kết quả (Chỉ hiển thị ở màn hình danh sách chính, ẩn đi khi đang xem chi tiết Khách sạn) */}
          {!selectedHotelForView && (
            <div className="results-header">
              <div className="results-count-box">
                <p className="results-count">
                  Tìm thấy <strong>{groupedHotels.length}</strong> khách sạn phù hợp ({rooms.length} loại phòng)
                </p>
                {loading && <span className="realtime-badge">Đang tải...</span>}
              </div>
            </div>
          )}

          {error && <div className="search-error-alert">{error}</div>}

          {rooms.length === 0 && !loading && (
            <div className="no-results-card">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy kết quả phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa, địa điểm hoặc điều chỉnh lại bộ lọc của bạn.</p>
              <button onClick={handleClearFilters} className="btn-secondary">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {/* ======================= CHẾ ĐỘ 1: TÌM THEO KHÁCH SẠN TRƯỚC (QUY TRÌNH CHUẨN) ======================= */}
          {viewMode === 'hotels' && rooms.length > 0 && (
            selectedHotelForView ? (
              // Bước 2 của Quy trình 1: Chi tiết Khách sạn & Danh sách các loại phòng bên trong
              <div className="hotel-drilldown-view">
                <button
                  className="btn-back-to-hotels"
                  onClick={() => setSelectedHotelForView(null)}
                >
                  ← Quay lại danh sách Khách sạn
                </button>

                <div className="hotel-hero-banner" style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url('${selectedHotelForView.images && selectedHotelForView.images[0] ? selectedHotelForView.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}')`
                }}>
                  <div className="hotel-hero-banner-content">
                    <div className="hotel-hero-meta">
                      <span className="hotel-hero-city">📍 {selectedHotelForView.city || 'Việt Nam'}</span>
                      <span className="hotel-hero-stars">{'★'.repeat(selectedHotelForView.starRating || 5)}</span>
                    </div>
                    <h2 className="hotel-hero-title">{selectedHotelForView.name}</h2>
                    <p className="hotel-hero-address">🏢 {selectedHotelForView.address || 'Địa chỉ đang cập nhật'}</p>
                    <p className="hotel-hero-desc">{selectedHotelForView.description}</p>
                    {selectedHotelForView.phone && (
                      <div className="hotel-hero-contact">
                        <span>📞 Hotline: {selectedHotelForView.phone}</span>
                        {selectedHotelForView.email && <span>✉️ Email: {selectedHotelForView.email}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="hotel-rooms-section">
                  <h3 className="section-title-rooms">
                    ✨ Các loại phòng trống tại {selectedHotelForView.name}
                  </h3>
                  <p className="section-subtitle-rooms">
                    Chọn loại phòng bạn thích, sau đó chọn ngày nhận/trả phòng để tiến hành đặt chỗ:
                  </p>

                  <div className="rooms-grid">
                    {selectedHotelForView.roomTypes.map((room) => (
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
                          <h4 className="room-card-title">{room.name}</h4>
                          <p className="room-card-desc">
                            {room.description || 'Tiện nghi sang trọng, ban công thoáng mát và không gian thư giãn tuyệt đối.'}
                          </p>

                          <div className="room-card-specs">
                            <span className="spec-item">📐 {room.areaSqm || '35'} m²</span>
                            <span className="spec-item">👥 {room.capacityAdults} NL {room.capacityChildren > 0 && `+ ${room.capacityChildren} TE`}</span>
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
                              🛏️ Đặt phòng này & Chọn ngày
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Bước 1 của Quy trình 1: Danh sách Khách sạn (Khi click sẽ xem các phòng bên trong)
              <div className="hotels-list-grid">
                {groupedHotels.map((hotel) => (
                  <div key={hotel.id} className="hotel-parent-card" onClick={() => setSelectedHotelForView(hotel)}>
                    <div className="hotel-parent-image-box">
                      <img
                        src={hotel.images && hotel.images[0] ? hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                        alt={hotel.name}
                        className="hotel-parent-image"
                        loading="lazy"
                      />
                      <div className="hotel-parent-price-badge">
                        <span>Giá phòng từ</span>
                        <strong>{hotel.minPrice ? hotel.minPrice.toLocaleString('vi-VN') : '0'} ₫</strong>
                        <small>/đêm</small>
                      </div>
                    </div>

                    <div className="hotel-parent-content">
                      <div className="hotel-parent-header">
                        <span className="hotel-city-badge">📍 {hotel.city || 'Việt Nam'}</span>
                        <span className="hotel-stars">{'★'.repeat(hotel.starRating || 5)}</span>
                      </div>

                      <h3 className="hotel-parent-title">{hotel.name}</h3>
                      <p className="hotel-parent-address">🏢 {hotel.address || 'Địa chỉ trung tâm'}</p>
                      
                      <p className="hotel-parent-desc">
                        {hotel.description || 'Khách sạn đạt chuẩn cao cấp với dịch vụ chuyên nghiệp cùng tầm nhìn tuyệt đẹp.'}
                      </p>

                      <div className="hotel-parent-room-summary">
                        <span className="room-summary-badge">✨ Có <strong>{hotel.roomTypes.length}</strong> loại phòng trống</span>
                        <div className="room-summary-tags">
                          {hotel.roomTypes.slice(0, 3).map((r, i) => (
                            <span key={i} className="room-type-pill">{r.name}</span>
                          ))}
                          {hotel.roomTypes.length > 3 && (
                            <span className="room-type-pill-more">+{hotel.roomTypes.length - 3} khác</span>
                          )}
                        </div>
                      </div>

                      <div className="hotel-parent-action">
                        <button className="btn-hotel-select">
                          👉 Chọn Khách Sạn & Xem {hotel.roomTypes.length} Loại Phòng →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ======================= CHẾ ĐỘ 2: TÌM TRỰC TIẾP THEO TỪNG PHÒNG (KIỂU CŨ) ======================= */}
          {viewMode === 'rooms' && rooms.length > 0 && (
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
          )}
        </div>
      </div>

      {/* Booking Modal (Bước chọn ngày Check-in/Check-out & Xác nhận) */}
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
