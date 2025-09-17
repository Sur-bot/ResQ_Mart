import { db } from "../firebase-api.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ===== Helpers ===== */
function parsePrice(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function formatMoney(n) {
  return (n || 0).toLocaleString("vi-VN") + " đ";
}

/* ===== Render cart ===== */
async function renderCart() {
  const tbody = document.getElementById("cart-list");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "gioHang"));
  let total = 0;

  snapshot.forEach((d) => {
    const sp = d.data();
    const id = d.id;

    const gia = parsePrice(sp.gia || sp.GiaCuoi || sp.GiaGoc);
    const soLuong = sp.soLuong || 1;
    const subtotal = gia * soLuong;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="cart-item-info">
          <img src="${sp.anh || sp.Anh || './images/placeholder.png'}" alt="${sp.ten || sp.Ten || ''}" />
          <div class="product-meta">
            <div class="product-title">${sp.ten || sp.Ten || ''}</div>
            <div class="product-desc">${sp.moTa || sp.MoTa || ''}</div>
            <button class="remove-btn" data-id="${id}">🗑 Xóa</button>
          </div>
        </div>
      </td>
      <td class="price-amount">${formatMoney(gia)}</td>
      <td>
        <div class="qty-control">
          <div class="qty-controls-row">
            <button class="qty-minus" data-id="${id}">-</button>
            <span class="qty-value">${soLuong}</span>
            <button class="qty-plus" data-id="${id}">+</button>
          </div>
        </div>
      </td>
      <td class="price-amount">${formatMoney(subtotal)}</td>
    `;
    tbody.appendChild(tr);
  });

  const totalEl = document.getElementById("total-value");
  if (totalEl) totalEl.textContent = formatMoney(total);

  // Event delegation for buttons in tbody
  tbody.onclick = async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    const docRef = doc(db, "gioHang", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const sp = snap.data();
    const soLuong = sp.soLuong || 1;

    if (btn.classList.contains("qty-plus")) {
      await updateDoc(docRef, { soLuong: soLuong + 1 });
      await renderCart();
    } else if (btn.classList.contains("qty-minus")) {
      if (soLuong > 1) {
        await updateDoc(docRef, { soLuong: soLuong - 1 });
      } else {
        await deleteDoc(docRef);
      }
      await renderCart();
    } else if (btn.classList.contains("remove-btn")) {
      await deleteDoc(docRef);
      await renderCart();
    }
  };
}

/* ===== Main: event handling và submit ===== */
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const checkoutBtn = document.querySelector(".checkout-btn");
  const checkoutForm = document.getElementById("checkout-form");
  const orderForm = document.getElementById("order-form");
  const successModal = document.getElementById("success-modal");
  const orderIdSpan = document.getElementById("order-id");
  const continueBtn = document.getElementById("continue-btn");

  // Toggle hiển thị form thanh toán
  if (checkoutBtn && checkoutForm) {
    checkoutBtn.addEventListener("click", () => {
      const currentlyHidden =
        checkoutForm.style.display === "none" || checkoutForm.style.display === "";
      checkoutForm.style.display = currentlyHidden ? "block" : "none";
      // cuộn tới form khi mở (tùy chọn)
      if (currentlyHidden) {
        checkoutForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Xử lý submit form: lưu thông tin khách hàng + giỏ hàng vào Firestore
  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // thu thập thông tin khách
      const name = document.getElementById("name")?.value.trim() || "";
      const phone = document.getElementById("phone")?.value.trim() || "";
      const address = document.getElementById("address")?.value.trim() || "";
      const note = document.getElementById("note")?.value.trim() || "";

      // Lấy snapshot hiện tại của giỏ hàng để lưu kèm
      try {
        const cartSnapshot = await getDocs(collection(db, "gioHang"));
        const items = [];
        let total = 0;
        cartSnapshot.forEach((d) => {
          const data = d.data();
          const id = d.id;
          const gia = parsePrice(data.gia || data.GiaCuoi || data.GiaGoc);
          const soLuong = data.soLuong || 1;
          const subtotal = gia * soLuong;
          total += subtotal;

          items.push({
            id,
            title: data.ten || data.Ten || "",
            price: gia,
            quantity: soLuong,
            subtotal,
            image: data.anh || data.Anh || "",
          });
        });

        // Thêm document đơn hàng vào collection 'thongTinKhachHang'
        const docRef = await addDoc(collection(db, "thongTinKhachHang"), {
          customer: {
            name,
            phone,
            address,
            note,
          },
          items,
          total,
          createdAt: serverTimestamp(),
        });

        // Hiển thị modal thành công (sử dụng id trả về)
        if (orderIdSpan) orderIdSpan.textContent = docRef.id;
        if (successModal) successModal.style.display = "flex";

        // reset form + render lại cart (không xóa giỏ hàng tự động, để xử lý tùy bạn)
        orderForm.reset();
        await renderCart();

        // nếu bạn muốn xóa toàn bộ giỏ hàng sau khi đặt thành công, bỏ comment đoạn dưới:
        cartSnapshot.forEach(async (d) => {
          await deleteDoc(doc(db, "gioHang", d.id));
        });

      } catch (error) {
        console.error("Lỗi khi lưu đơn hàng:", error);
        alert("Có lỗi xảy ra khi lưu đơn hàng. Vui lòng thử lại.");
      }
    });
  }

  // Nút tiếp tục mua hàng trong modal
  if (continueBtn && successModal) {
    continueBtn.addEventListener("click", () => {
      successModal.style.display = "none";
      window.location.href = "../index.html"; // hoặc trang khác
    });
  }

  // Nếu click ngoài nội dung modal thì đóng modal (tùy chọn)
  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) {
        successModal.style.display = "none";
      }
    });
  }

  // Lần đầu render giỏ hàng
  renderCart().catch((err) => console.error("renderCart error:", err));
});
