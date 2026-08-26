import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ૧. Firebase સેટઅપ
const firebaseConfig = {
    apiKey: "AIzaSyCjboFcoWJmVrjC9J0Izi4ZgjMnau9czmU",
    authDomain: "fee-managemant.firebaseapp.com",
    databaseURL: "https://fee-managemant-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fee-managemant",
    storageBucket: "fee-managemant.firebasestorage.app",
    messagingSenderId: "1029215490651",
    appId: "1:1029215490651:web:2f4136fa77e93fc6f4a57e",
    measurementId: "G-1GG5W5W7R6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.studentsData = {};
window.currentStudentId = null;

// Firebase Realtime Synchronization
onValue(ref(db, 'students'), (snapshot) => {
    window.studentsData = snapshot.val() || {};
    if (typeof window.renderStudentList === 'function') {
        window.renderStudentList();
    }
    if (window.currentStudentId && typeof window.loadStudentDetails === 'function') {
        window.loadStudentDetails(window.currentStudentId);
    }
});

// ૨. વિભાગો દર્શાવવા અને છુપાવવા (Section Navigation)
window.showSection = function(sectionId) {
    const sections = ['dashboardSection', 'addStudentSection', 'studentDetailsSection', 'stationerySection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === sectionId) ? 'block' : 'none';
    });
};

window.showDashboard = function() {
    window.currentStudentId = null;
    window.showSection('dashboardSection');
};

// ૩. "નવો વિદ્યાર્થી ઉમેરો" બટન ફંક્શન
window.addStudent = function() {
    window.currentStudentId = null;
    const form = document.getElementById("addStudentForm");
    if (form) form.reset();
    
    // આજે ડિફોલ્ટ દાખલ તારીખ સેટ કરો
    const joinDateInput = document.getElementById("joinDate");
    if (joinDateInput) {
        joinDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    window.showSection('addStudentSection');
};

// ૪. વિદ્યાર્થી માહિતી સેવ કરવી (Save Student)
window.saveStudent = function() {
    const name = document.getElementById("studentName")?.value;
    const phone = document.getElementById("phone")?.value;
    const std = document.getElementById("studentStd")?.value;
    const course = document.getElementById("course")?.value;
    const feeType = document.querySelector('input[name="feeType"]:checked')?.value || "માસિક";
    const monthlyFee = parseFloat(document.getElementById("monthlyFee")?.value) || 0;
    const joinDate = document.getElementById("joinDate")?.value;
    const dob = document.getElementById("dob")?.value;
    const status = document.getElementById("status")?.value || "Active (ચાલુ છે)";

    if (!name || !phone) {
        alert("કૃપા કરીને વિદ્યાર્થીનું નામ અને મોબાઈલ નંબર લખો.");
        return;
    }

    const id = window.currentStudentId || "STU_" + Date.now();

    const studentObj = {
        id, name, phone, std, course, feeType, monthlyFee, joinDate, dob, status,
        stationery: window.studentsData[id]?.stationery || [],
        receipts: window.studentsData[id]?.receipts || []
    };

    set(ref(db, 'students/' + id), studentObj).then(() => {
        alert("વિદ્યાર્થી સફળતાપૂર્વક ઉમેરાઈ ગયો!");
        const form = document.getElementById("addStudentForm");
        if (form) form.reset();
        window.showDashboard();
    }).catch(error => {
        alert("ભૂલ આવી: " + error.message);
    });
};

// ૫. ઓટો ફી ગણતરી (Auto Fee Calculation)
window.calculateAutoFee = function(joinDateStr, monthlyFee) {
    if (!joinDateStr || !monthlyFee) return 0;
    const join = new Date(joinDateStr);
    const today = new Date();
    const diffTime = Math.max(0, today - join);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = monthlyFee / 30;
    return Math.round(diffDays * dailyRate);
};

// ૬. રસીદ બનાવવાનું ફંક્શન (Generate Receipt)
window.generateReceipt = function() {
    if (!window.currentStudentId) return;

    const fromDate = document.getElementById("fromDate")?.value;
    const toDate = document.getElementById("toDate")?.value;
    const autoFee = parseFloat(document.getElementById("autoFee")?.value) || 0;
    const paidAmount = parseFloat(document.getElementById("paidAmount")?.value) || 0;
    const discount = parseFloat(document.getElementById("discount")?.value) || 0;
    const paymentMode = document.getElementById("paymentMode")?.value || "રોકડ/ઓન લાઈન";
    const payerName = document.getElementById("payerName")?.value || "";

    const receiptObj = {
        id: "REC_" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        fromDate,
        toDate,
        autoFee,
        paidAmount,
        discount,
        dueAmount: autoFee - (paidAmount + discount),
        paymentMode,
        payerName
    };

    const student = window.studentsData[window.currentStudentId];
    const updatedReceipts = student.receipts ? [...student.receipts, receiptObj] : [receiptObj];

    set(ref(db, `students/${window.currentStudentId}/receipts`), updatedReceipts).then(() => {
        alert("પહોંચ સફળતાપૂર્વક બની ગઈ છે!");
        if (typeof window.showReceiptModal === 'function') {
            window.showReceiptModal(receiptObj, student);
        }
    });
};

// ૭. રસીદ ઈમેજ પોપ-અપ (Receipt Modal)
window.showReceiptModal = function(receipt, student) {
    const modal = document.getElementById("receiptModal");
    if (!modal) return;

    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.innerText = txt;
    };

    setTxt("modalStudentName", student.name);
    setTxt("modalStdCourse", `ધોરણ: ${student.std} | કોર્સ: ${student.course} | જમા તારીખ: ${receipt.date}`);
    setTxt("modalFeeAmount", receipt.autoFee);
    setTxt("modalTotal", receipt.autoFee);
    setTxt("modalPaid", receipt.paidAmount);
    setTxt("modalDue", Math.max(0, receipt.dueAmount));
    setTxt("modalDateRange", `સમયગાળો: ${receipt.fromDate} થી ${receipt.toDate}`);
    setTxt("modalPayer", `ફી ભરનાર: ${receipt.payerName}`);
    setTxt("modalFooterInfo", `${student.name} (${student.phone})`);

    modal.style.display = "block";
};

window.closeReceiptModal = function() {
    const modal = document.getElementById("receiptModal");
    if (modal) modal.style.display = "none";
};
