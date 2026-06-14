const API_URL = "https://script.google.com/macros/s/AKfycbx5b3DRXeMxrAgTfdwm_zPQa_KlhsimEeFxFyRt72J-hpwUnpW6DatVCzHllax2TROSEQ/exec";

let settings = {};
let currentData = {};
let empIdGlobal = "";

// Theme Management
function toggleTheme() {
  const body = document.documentElement;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const icon = document.getElementById('themeIcon');
  icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const icon = document.getElementById('themeIcon');
  icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// LOGIN
async function login(){
  let empId = document.getElementById("empId").value.trim();
  let password = document.getElementById("password").value.trim();

  if (!empId || !password) {
    alert("يرجى إدخال رقم الأداء وكلمة السر");
    return;
  }

  try {
    let res = await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify({action:"login",empId,password})
    });

    let data = await res.json();

    if(data.success){
      empIdGlobal = empId;
      settings = data.settings;

      document.getElementById("loginBox").classList.add("hidden");
      document.getElementById("appBox").classList.remove("hidden");
    }else{
      alert("بيانات الدخول غير صحيحة");
    }
  } catch(e) {
    alert("حدث خطأ في الاتصال");
  }
}

// CALCULATE
function calculate(){
  let normal = parseFloat(document.getElementById("normal").value) || 0;
  let holiday = parseFloat(document.getElementById("holiday").value) || 0;
  let holidayRate = parseFloat(document.getElementById("holidayRate").value) || 0;

  let basic = (settings.basic || 0);
  let regular = (settings.regular || 0);
  let transport = (settings.transport || 0);
  let bonus = (settings.bonus || 0);
  let risk = (settings.risk || 0) * normal;

  let normalPay = normal * 335;
  let holidayPay = holiday * holidayRate;

  let total = basic + regular + transport + bonus + risk + normalPay + holidayPay;

  let insurance = 540;
  let phones = 89;
  let tax = calcTax(total);
  let totalDeductions = insurance + phones + tax;
  let net = total - totalDeductions;

  currentData = { total, insurance, phones, tax, net, normal, holiday };

  let table = `
    <tr><td>الأساسي</td><td>${basic.toFixed(2)}</td></tr>
    <tr><td>بدل انتظام</td><td>${regular.toFixed(2)}</td></tr>
    <tr><td>بدل انتقال</td><td>${transport.toFixed(2)}</td></tr>
    <tr><td>حافز</td><td>${bonus.toFixed(2)}</td></tr>
    <tr><td>بدل مخاطر</td><td>${risk.toFixed(2)}</td></tr>
    <tr><td>الورديات العادية</td><td>${normalPay.toFixed(2)}</td></tr>
    <tr><td>ورديات الإجازة</td><td>${holidayPay.toFixed(2)}</td></tr>
    <tr><td><strong>إجمالي الاستحقاقات</strong></td><td><strong>${total.toFixed(2)}</strong></td></tr>
    <tr><td>تأمينات</td><td>${insurance.toFixed(2)}</td></tr>
    <tr><td>تليفونات</td><td>${phones.toFixed(2)}</td></tr>
    <tr><td>الضرائب</td><td>${tax.toFixed(2)}</td></tr>
    <tr><td><strong>إجمالي الخصومات</strong></td><td><strong>${totalDeductions.toFixed(2)}</strong></td></tr>
  `;

  document.getElementById("resultTable").innerHTML = table;
  document.getElementById("net").innerText = "صافي المرتب: " + net.toFixed(2) + " جنيه";
  document.getElementById("resultBox").classList.remove("hidden");
}

// TAX
function calcTax(Msalary){

  let annual = Math.floor((Msalary * 12) / 10) * 10;

  annual -= 20000;

  let tax = 0;

  if (annual <= 40000) {
    tax = 0;

  } else if (annual <= 55000) {
    tax = (annual - 40000) * 0.1;

  } else if (annual <= 70000) {
    tax = (annual - 55000) * 0.15 + 1500;

  } else if (annual <= 200000) {
    tax = (annual - 70000) * 0.2 + 1500 + 2250;

  } else if (annual <= 400000) {
    tax = (annual - 200000) * 0.225 + 1500 + 2250 + 26000;

  } else if (annual <= 600000) {
    tax = (annual - 400000) * 0.25 + 1500 + 2250 + 26000 + 45000;

  } else if (annual <= 700000) {
    tax = (annual - 400000) * 0.25 + 5500 + 2250 + 26000 + 45000;

  } else if (annual <= 800000) {
    tax = (annual - 400000) * 0.25 + 10500 + 26000 + 45000;

  } else if (annual <= 900000) {
    tax = (annual - 400000) * 0.25 + 40000 + 45000;

  } else if (annual <= 1200000) {
    tax = (annual - 400000) * 0.25 + 90000;

  } else {
    tax = ((annual - 1200000) * 0.275) + 300000;
  }

  return tax / 12;
}

// SAVE
async function save(){
  let month = document.getElementById("month").value.trim();
  let year = document.getElementById("year").value.trim();

  if (!month || !year) {
    alert("يرجى إدخال الشهر والسنة");
    return;
  }

  try {
    await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify({
        action:"save",
        empId:empIdGlobal,
        month,year,
        ...currentData
      })
    });

    alert("✅ تم حفظ السجل بنجاح");
  } catch(e) {
    alert("حدث خطأ أثناء الحفظ");
  }
}

// ARCHIVE
async function loadArchive(){
  try {
    let res = await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify({
        action:"archive",
        empId:empIdGlobal
      })
    });

    let data = await res.json();

    let html = "<div style='max-height:400px;overflow-y:auto;'>";

    if (data && data.length > 0) {
      data.forEach(r => {
        html += `
          <div class="archive-item">
            <strong>${r.month}/${r.year}</strong><br>
            <span style="color:var(--success)">الصافي: ${parseFloat(r.net).toFixed(2)} جنيه</span>
          </div>
        `;
      });
    } else {
      html += "<p style='text-align:center;color:#64748b;padding:20px;'>لا توجد سجلات سابقة</p>";
    }

    html += "</div>";

    document.getElementById("archiveData").innerHTML = html;
    document.getElementById("archiveBox").classList.remove("hidden");
  } catch(e) {
    alert("حدث خطأ أثناء تحميل الأرشيف");
  }
}

// Initialize
window.onload = function() {
  loadTheme();
};
