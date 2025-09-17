// product-detail.js
import { db, updateCartCount } from "./firebase-api.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ------------------- Lấy query param từ URL -------------------
function getQueryParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    category: p.get("category"),
    sub: p.get("sub"),
    id: p.get("id"),
  };
}

// ------------------- Hiệu ứng nhảy vào giỏ hàng -------------------
function animateToCart(imgSrc) {
  const cartBtn = document.querySelector(".cart-btn");
  if (!cartBtn) return;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.className = "flying-img";
  img.style.position = "fixed";
  img.style.width = "50px";
  img.style.height = "50px";
  img.style.borderRadius = "50%";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%, -50%) scale(1)";
  img.style.transition = "all 0.5s ease-in-out";
  img.style.zIndex = "9999";
  document.body.appendChild(img);

  const rect = cartBtn.getBoundingClientRect();
  setTimeout(() => {
    img.style.top = rect.top + "px";
    img.style.left = rect.left + "px";
    img.style.transform = "translate(0,0) scale(0.1)";
    img.style.opacity = "0.5";
  }, 50);

  setTimeout(() => img.remove(), 500);
}

// ------------------- Load sản phẩm liên quan + slider -------------------
async function loadRelated(category, sub, excludeId) {
  try {
    const qSnap = await getDocs(collection(db, "loaiSanPham", category, sub));
    const relatedList = document.getElementById("related-list");
    if (!relatedList) return;

    relatedList.innerHTML = "";

    qSnap.forEach((docSnap) => {
      if (docSnap.id === excludeId) return;
      const data = docSnap.data();

      const card = document.createElement("div");
      card.className = "related-card";
      card.innerHTML = `
        <img src="${data.Anh || "https://placehold.co/200"}" alt="${data.Ten || "SP"}"/>
        <h4>${data.Ten || "Sản phẩm"}</h4>
        <span class="old-price">${data.GiaGoc || ""}</span>
        <p class="price">${data.GiaCuoi || ""}</p>
        <button class="buy-btn" type="button">MUA</button>
      `;

      // click card → mở chi tiết
      card.addEventListener("click", () => {
        window.location.href = `./product-detail.html?category=${category}&sub=${sub}&id=${docSnap.id}`;
      });

      // nút mua → thêm giỏ hàng
      const buyBtn = card.querySelector(".buy-btn");
      buyBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const product = {
          id: docSnap.id,
          ten: data.Ten || "",
          moTa: data.MoTa || "",
          gia:data.GiaCuoi || "",
          anh: data.Anh || "https://placehold.co/200",
          soLuong: 1,
        };

        try {
          const q = query(collection(db, "gioHang"), where("id", "==", product.id));
          const existing = await getDocs(q);
          if (!existing.empty) {
            const docRef = existing.docs[0].ref;
            const cur = existing.docs[0].data();
            await updateDoc(docRef, { soLuong: (cur.soLuong || 1) + 1 });
          } else {
            await addDoc(collection(db, "gioHang"), product);
          }

          await updateCartCount();
          animateToCart(product.anh);
        } catch (err) {
          console.error("🔥 Lỗi thêm giỏ hàng:", err);
        }
      });

      relatedList.appendChild(card);
    });

    initSlider();
  } catch (err) {
    console.error("🔥 Lỗi load sản phẩm liên quan:", err);
  }
}

// ------------------- Slider autoplay + nút mũi tên -------------------
let autoSlideInterval = null;

function initSlider() {
  const slider = document.getElementById("related-list");
  if (!slider) return;
  const cards = slider.querySelectorAll(".related-card");
  if (!cards.length) return;

  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }

  const computedStyle = window.getComputedStyle(slider);
  const gap = parseInt(computedStyle.gap) || 16;
  const cardWidth = cards[0].offsetWidth + gap;

  const parentWidth = slider.parentElement ? slider.parentElement.offsetWidth : window.innerWidth;
  const visibleCount = Math.max(1, Math.floor(parentWidth / cardWidth));
  const maxIndex = Math.max(0, cards.length - visibleCount);

  let currentIndex = 0;

  function goTo(index) {
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    updateArrowState();
  }

  // mũi tên
  const leftBtn = document.getElementById("slide-left");
  const rightBtn = document.getElementById("slide-right");

  function updateArrowState() {
    if (leftBtn) leftBtn.disabled = currentIndex <= 0;
    if (rightBtn) rightBtn.disabled = currentIndex >= maxIndex;
  }

  if (leftBtn) {
    leftBtn.onclick = (e) => {
      e.preventDefault();
      goTo(currentIndex - 1);
      restartAuto();
    };
  }
  if (rightBtn) {
    rightBtn.onclick = (e) => {
      e.preventDefault();
      goTo(currentIndex + 1);
      restartAuto();
    };
  }

  // autoplay
  function startAuto() {
    stopAuto();
    if (maxIndex <= 0) return;
    autoSlideInterval = setInterval(() => {
      if (currentIndex < maxIndex) goTo(currentIndex + 1);
      else goTo(0);
    }, 2000);
  }

  function stopAuto() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }

  function restartAuto() {
    stopAuto();
    setTimeout(startAuto, 600);
  }

  // hover dừng
  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  goTo(0);
  startAuto();

  // recalc khi resize
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      slider.style.transition = "none";
      slider.style.transform = "translateX(0)";
      setTimeout(() => (slider.style.transition = ""), 50);
      initSlider();
    }, 150);
  });
}

// ------------------- Load chi tiết sản phẩm -------------------
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
    document.getElementById("pd-name").textContent = data.Ten || "";
    document.getElementById("pd-final").textContent = data.GiaCuoi || "";
    document.getElementById("pd-old").textContent = data.GiaGoc || "";
    document.getElementById("pd-sale").textContent = data.Sale ? `- ${data.Sale}` : "";
    document.getElementById("pd-desc").textContent = data.MoTa || "";
    document.getElementById("pd-date").textContent = data.HanSuDung ? `Hạn Sử Dụng: ${data.HanSuDung}` : "";

    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      startCountdown(expiryDate);
    }

    // nút mua ngay
    document.getElementById("pd-buy").addEventListener("click", async () => {
      const product = {
        id: id,
        ten: data.Ten || "",
        moTa: data.MoTa || "",
        gia: data.GiaCuoi || "",
        anh: data.Anh || "https://placehold.co/100",
        soLuong: 1,
      };

      try {
        const q = query(collection(db, "gioHang"), where("id", "==", product.id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          const current = querySnapshot.docs[0].data();
          await updateDoc(docRef, { soLuong: current.soLuong + 1 });
        } else {
          await addDoc(collection(db, "gioHang"), product);
        }
        await updateCartCount();
        animateToCart(product.anh);
      } catch (err) {
        console.error("🔥 Lỗi thêm giỏ hàng:", err);
      }
    });

    loadRelated(category, sub, id);
  } catch (err) {
    console.error("🔥 Lỗi khi tải sản phẩm:", err);
    document.getElementById("pd-name").textContent = "Lỗi khi tải sản phẩm";
  }
}

// ------------------- Countdown -------------------
function startCountdown(expiry) {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  function updateCountdown() {
    const now = Date.now();
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
