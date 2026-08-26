import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Firebase સેટઅપ
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

let studentsData = {};
let currentStudentId = null;

// Realtime ડેટા લોડ
onValue(ref(db, 'students'), (snapshot) => {
    studentsData = snapshot.val() || {};
    if (typeof renderStudentList === 'function') renderStudentList();
    if (currentStudentId && typeof loadStudentDetails === 'function') {
        loadStudentDetails(currentStudentId);
    }
});

// 2. વિદ્યાર્થી સેવ કરવાનો કોડ
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

    const id = currentStudentId || "STU_" + Date.now();

    const studentObj = {
        id, name, phone, std, course, feeType, monthlyFee, joinDate, dob, status,
        stationery: studentsData[id]?.stationery || [],
        receipts: studentsData[id]?.receipts || []
    };

    set(ref(db, 'students/' + id), studentObj).then(() => {
        alert("વિદ્યાર્થી સફળતાપૂર્વક ઉમેરાઈ ગયો!");
        if (document.getElementById("addStudentForm")) document.getElementById("addStudentForm").reset();
        if (typeof showDashboard === 'function') showDashboard();
    }).catch(error => {
        alert("ભૂલ આવી: " + error.message);
    });
};

// 3. ઓટો ફી કેલ્ક્યુલેશન
window.calculateAutoFee = function(joinDateStr, monthlyFee) {
    if (!joinDateStr || !monthlyFee) return 0;
    const join = new Date(joinDateStr);
    const today = new Date();
    const diffTime = Math.max(0, today - join);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = monthlyFee / 30;
    return Math.round(diffDays * dailyRate);
};

// 4. પહોંચ બનાવવાનું ફંક્શન
window.generateReceipt = function() {
    if (!currentStudentId) return;

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

    const student = studentsData[currentStudentId];
    const updatedReceipts = student.receipts ? [...student.receipts, receiptObj] : [receiptObj];

    set(ref(db, `students/${currentStudentId}/receipts`), updatedReceipts).then(() => {
        alert("પહોંચ સફળતાપૂર્વક બની ગઈ છે!");
        showReceiptModal(receiptObj, student);
    });
};

// 5. રસીદ પોપ-અપ પ્રીવ્યૂ
function showReceiptModal(receipt, student) {
    const modal = document.getElementById("receiptModal");
    if (!modal) return;

    document.getElementById("modalStudentName").innerText = student.name;
    document.getElementById("modalStdCourse").innerText = `ધોરણ: ${student.std} | કોર્સ: ${student.course} | જમા તારીખ: ${receipt.date}`;
    document.getElementById("modalFeeAmount").innerText = receipt.autoFee;
    document.getElementById("modalTotal").innerText = receipt.autoFee;
    document.getElementById("modalPaid").innerText = receipt.paidAmount;
    document.getElementById("modalDue").innerText = Math.max(0, receipt.dueAmount);
    document.getElementById("modalDateRange").innerText = `સમયગાળો: ${receipt.fromDate} થી ${receipt.toDate}`;
    document.getElementById("modalPayer").innerText = `ફી ભરનાર: ${receipt.payerName}`;
    document.getElementById("modalFooterInfo").innerText = `${student.name} (${student.phone})`;

    modal.style.display = "block";
}
