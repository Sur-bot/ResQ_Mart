// product-detail.js
import { db } from "../firebase-api.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Lấy query param từ URL
function getQueryParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    category: p.get("category"),
    sub: p.get("sub"),
    id: p.get("id"),
  };
}

// Load sản phẩm liên quan
async function loadRelated(category, sub, excludeId) {
  try {
    const querySnapshot = await getDocs(
      collection(db, "loaiSanPham", category, sub)
    );
    const relatedList = document.getElementById("related-list");
    relatedList.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      if (docSnap.id === excludeId) return;

      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "related-card";

      card.innerHTML = `
        <img src="${data.Anh || "https://placehold.co/200"}" alt="${data.MoTa || "SP"}"/>
        <p>${data.MoTa || ""}</p>
        <span class="old-price">${data.GiaGoc || ""}</span>
        <p class="price">${data.GiaCuoi || ""}</p>
        <button class="buy-btn" type="button">MUA</button>
      `;

      card.addEventListener("click", () => {
        window.location.href = `product-detail.html?category=${category}&sub=${sub}&id=${docSnap.id}`;
      });

      relatedList.appendChild(card);
    });

    initSlider();
  } catch (err) {
    console.error("Lỗi load sản phẩm liên quan:", err);
  }
}

// Load chi tiết sản phẩm
async function loadDetail() {
  const { category, sub, id } = getQueryParams();
  if (!category || !sub || !id) {
    document.getElementById("pd-name").textContent = "Không tìm thấy sản phẩm";
    return;
  }

  try {
    const docRef = doc(db, "loaiSanPham", category, sub, id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      document.getElementById("pd-name").textContent = "Sản phẩm không tồn tại";
      return;
    }

    const data = snap.data();

    document.getElementById("pd-img").src = data.Anh || "https://placehold.co/400";
    document.getElementById("pd-img").alt = data.Ten || "Sản phẩm";
    document.getElementById("pd-name").textContent = data.Ten || "";
    document.getElementById("pd-final").textContent = data.GiaCuoi || "";
    document.getElementById("pd-old").textContent = data.GiaGoc || "";
    document.getElementById("pd-sale").textContent = data.Sale ? `-${data.Sale}` : "";
    document.getElementById("pd-desc").textContent = data.MoTa || "";
    document.getElementById("pd-date").textContent = data.HanSuDung ? `Hạn Sử Dụng: ${data.HanSuDung}` : "";

    // Nếu có HanSuDung thì bắt đầu countdown
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      startCountdown(expiryDate);
    }

    document.getElementById("pd-buy").addEventListener("click", () => {
      alert(`Đã thêm "${data.Ten}" vào giỏ hàng`);
    });

    // Load sản phẩm liên quan
    loadRelated(category, sub, id);

  } catch (err) {
    console.error("🔥 Lỗi khi tải sản phẩm:", err);
    document.getElementById("pd-name").textContent = "Lỗi khi tải sản phẩm";
  }
}

// ----- Slider logic -----
let currentIndex = 0;
let autoSlide;

function initSlider() {
  const slider = document.getElementById("related-list");
  const cards = slider.querySelectorAll(".related-card");
  if (cards.length === 0) return;

  const cardWidth = cards[0].offsetWidth + 16; // +gap
  const maxIndex = cards.length - Math.floor(slider.parentElement.offsetWidth / cardWidth);

  function goTo(index) {
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
  }

  document.getElementById("slide-left").onclick = () => goTo(currentIndex - 1);
  document.getElementById("slide-right").onclick = () => goTo(currentIndex + 1);

  function startAuto() {
    autoSlide = setInterval(() => {
      if (currentIndex < maxIndex) goTo(currentIndex + 1);
      else goTo(0);
    }, 2000);
  }

  function stopAuto() {
    clearInterval(autoSlide);
  }

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  startAuto();
}

// ----- Countdown -----
function startCountdown(expiry) {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = expiry.getTime() - now;

    if (distance <= 0) {
      countdownEl.textContent = "⏰ Hết hạn!";
      clearInterval(timer);
      return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownEl.textContent = `⏳ Còn lại: ${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

loadDetail();
