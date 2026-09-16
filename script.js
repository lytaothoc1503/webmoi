// Dữ liệu hình ảnh theo từng hạng phòng tại Nhà của An Homestay Tà Xùa
const roomData = {
  villa: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  ],
  double: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
  ],
};

let currentCategory = 'villa';
let currentIdx = 0;

function switchRoom(type) {
  currentCategory = type;
  currentIdx = 0;

  // Cập nhật giao diện tab active
  const tabs = document.querySelectorAll('.room-tab');
  tabs.forEach((tab) => {
    if (
      tab.textContent.includes(
        type === 'villa' ? 'Lưng Núi Villa' : 'Phòng Đôi Vintage'
      )
    ) {
      tab.style.background = '#5c3a21';
    } else {
      tab.style.background = '#3b2413';
    }
  });

  updateImage();
}

function changeSlide(direction) {
  const images = roomData[currentCategory];
  currentIdx = (currentIdx + direction + images.length) % images.length;
  updateImage();
}

function updateImage() {
  const imgElement = document.getElementById('active-room-img');
  if (imgElement) {
    imgElement.src = roomData[currentCategory][currentIdx];
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('Nhà của An Homestay Tà Xùa - Loaded Successfully!');
});
