console.log("TRÍ ĐỨC REALTY READY");

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybHD85YZ8EvpRLEGyGAkCYfBALElrH338ca5JwNN84HsFjNCQ4MAr5-NscEDFUkGxdjg/exec";

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const btn     = form.querySelector("button");
    const name    = document.getElementById("name").value.trim();
    const phone   = document.getElementById("phone").value.trim();
    const project = document.getElementById("project").value;

    if (!name)  { alert("Vui lòng nhập họ tên");        return; }
    if (!phone) { alert("Vui lòng nhập số điện thoại"); return; }

    btn.disabled  = true;
    btn.innerText = "ĐANG GỬI...";

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode:   "no-cors",
        body:   JSON.stringify({ name, phone, project })
      });

      document.getElementById("message").innerHTML = `
        <div class="alert alert-success mt-3">
          ✅ Đăng ký thành công!<br>
          Trí Đức Realty sẽ liên hệ với anh/chị trong thời gian sớm nhất.
        </div>`;

      form.reset();

    } catch (error) {
      console.error(error);
      document.getElementById("message").innerHTML = `
        <div class="alert alert-danger mt-3">
          ❌ Không thể gửi dữ liệu. Vui lòng thử lại.
        </div>`;
    }

    btn.disabled  = false;
    btn.innerText = "NHẬN TƯ VẤN MIỄN PHÍ";

  });
});