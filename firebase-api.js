import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbkb-5PkE5-Uy7BCvkhJCnjfS5lrq8g8Y",
  authDomain: "bachhoaxanh-ce63c.firebaseapp.com",
  projectId: "bachhoaxanh-ce63c",
  storageBucket: "bachhoaxanh-ce63c.firebasestorage.app",
  messagingSenderId: "373634975829",
  appId: "1:373634975829:web:6d7ad9018335c882a16cdc",
  measurementId: "G-W07CCJZX9F",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// 🔹 Hàm load sản phẩm
export async function loadProducts() {
  const querySnapshot = await getDocs(
    collection(db, "loaiSanPham", "bia-nuocGiaiKhat", "NuocNgot")
  );

  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${data.Anh}" alt="${data.Ten}" />
<p class="desc">${data.MoTa}</p>
      <p class="price">
        ${data.GiaCuoi} <span class="old-price">${data.GiaGoc}</span>
      </p>
      <p class="sale">Giảm: ${data.Sale}</p>
      
      <button class="buy-btn">MUA</button>
    `;

    productList.appendChild(card);
  });
}
