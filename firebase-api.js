import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ✅ Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBbkb-5PkE5-Uy7BCvkhJCnjfS5lrq8g8Y",
  authDomain: "bachhoaxanh-ce63c.firebaseapp.com",
  projectId: "bachhoaxanh-ce63c",
  storageBucket: "bachhoaxanh-ce63c.appspot.com",
  messagingSenderId: "373634975829",
  appId: "1:373634975829:web:6d7ad9018335c882a16cdc",
  measurementId: "G-W07CCJZX9F",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function loadProducts(category, subCategory) {
  try {
    const querySnapshot = await getDocs(
      collection(db, "loaiSanPham", category, subCategory)
    );

    const productList = document.getElementById("product-list");
    if (!productList) {
      console.error("❌ Không tìm thấy #product-list trong DOM");
      return;
    }
    productList.innerHTML = "";

    // 🔥 Danh sách banner
    const banners = [
      "/images/Banner-03.png",
      "/images/Banner-02.png",
      "/images/Banner-01.png",
      "/images/Banner-04.png",
    ];

    let count = 0;
    let bannerIndex = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const detailUrl = `../product-details/product-detail.html?category=${encodeURIComponent(
        category
      )}&sub=${encodeURIComponent(subCategory)}&id=${encodeURIComponent(
        docSnap.id
      )}`;

      // ✅ Tạo thẻ sản phẩm
      const a = document.createElement("a");
      a.href = detailUrl;
      a.className = "product-link";
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.innerHTML = `
        <div class="product-card">
          <img src="${data.Anh || "https://placehold.co/200"}" alt="${data.Ten || "Sản phẩm"}" />
          <h3 class="product-name">${data.Ten || "Không có tên"}</h3>
          <p class="desc">${data.MoTa || ""}</p>
          <p class="price">
            ${data.GiaCuoi || ""} 
            <span class="old-price">${data.GiaGoc || ""}</span>
          </p>
          <p class="sale">${data.Sale ? `- ${data.Sale}` : ""}</p>
          <button class="buy-btn" type="button">MUA</button>
        </div>
      `;

      productList.appendChild(a);

      count++;

      // ✅ Chèn banner sau mỗi 4 sản phẩm
      if (count % 4 === 0) {
        const banner = document.createElement("div");
        banner.className = "banner-bnn";
        banner.innerHTML = `<img src="${banners[bannerIndex]}" alt="Banner ${bannerIndex + 1}" />`;
        productList.appendChild(banner);

        // Xoay vòng banner
        bannerIndex = (bannerIndex + 1) % banners.length;
      }
    });
  } catch (err) {
    console.error("Lỗi load sản phẩm:", err);
  }
}
