import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase સેટઅપ
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_DATABASE_NAME.firebaseio.com",
    projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let studentsData = {};
let currentStudentId = null;

// પેજ સ્વિચ કરવાના ફંક્શન્સ
window.showForm = () => {
    document.getElementById("dashboardView").classList.add("hidden");
    document.getElementById("formView").classList.remove("hidden");
    document.getElementById("sJoinDate").valueAsDate = new Date();
};

window.showDashboard = () => {
    document.getElementById("formView").classList.add("hidden");
    document.getElementById("detailView").classList.add("hidden");
    document.getElementById("dashboardView").classList.remove("hidden");
};

// ૧. નવો વિદ્યાર્થી સેવ કરવો
window.saveStudent = (e) => {
    e.preventDefault();
    const id = Date.now();
    const student = {
        name: document.getElementById("sName").value,
        phone: document.getElementById("sPhone").value,
        std: document.getElementById("sStd").value,
        course: document.getElementById("sCourse").value,
        feeType: document.getElementById("sFeeType").value,
        monthlyFee: parseFloat(document.getElementById("sMonthlyFee").value),
        joinDate: document.getElementById("sJoinDate").value,
        paidFee: 0,
        status: "Active"
    };

    set(ref(db, 'students/' + id), student).then(() => {
        alert("વિદ્યાર્થી સફળતાપૂર્વક ઉમેરાઈ ગયો!");
        showDashboard();
    });
};

// ૨. ઓટો દિવસો અને ફી ની ગણતરી (Auto Calculation)
function calculateAutoFee(joinDateStr, monthlyFee) {
    const joinDate = new Date(joinDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // દિવસ પ્રમાણે ઓટો ફી (મહિનાના ૩૦ દિવસ ગણીને)
    const dailyRate = monthlyFee / 30;
    const autoFee = Math.round(diffDays * dailyRate);

    return { diffDays, autoFee };
}

// ૩. ડેટાબેઝમાંથી ડેટા રીડ કરવો
onValue(ref(db, 'students'), (snapshot) => {
    studentsData = snapshot.val() || {};
    renderStudents();
});

function renderStudents() {
    const listDiv = document.getElementById("studentList");
    listDiv.innerHTML = "";
    
    let active = 0, inactive = 0;
    let totCalc = 0, totPaid = 0, totPending = 0;

    for (let id in studentsData) {
        const s = studentsData[id];
        if (s.status === "Active") active++; else inactive++;

        const { diffDays, autoFee } = calculateAutoFee(s.joinDate, s.monthlyFee);
        const pendingFee = autoFee - s.paidFee;

        totCalc += autoFee;
        totPaid += s.paidFee;
        totPending += pendingFee;

        const card = document.createElement("div");
        card.className = "card student-item";
        card.onclick = () => openStudentDetail(id);
        card.innerHTML = `
            <h3>👤 ${s.name} <span style="font-size: 12px; background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${s.course}</span></h3>
            <p style="margin-top: 5px; font-size: 14px;">
                કુલ ઓટો: <strong>₹${autoFee}</strong> | 
                જમા: <strong style="color: green;">₹${s.paidFee}</strong> | 
                બાકી: <strong style="color: red;">₹${pendingFee}</strong>
            </p>
        `;
        listDiv.appendChild(card);
    }

    document.getElementById("activeCount").innerText = active;
    document.getElementById("inactiveCount").innerText = inactive;
    document.getElementById("totalCalculated").innerText = "₹" + totCalc;
    document.getElementById("totalPaid").innerText = "₹" + totPaid;
    document.getElementById("totalPending").innerText = "₹" + totPending;
}

// ૪. વિદ્યાર્થી ડિટેલ્સ ખોલવી
window.openStudentDetail = (id) => {
    currentStudentId = id;
    const s = studentsData[id];
    const { diffDays, autoFee } = calculateAutoFee(s.joinDate, s.monthlyFee);
    const pending = autoFee - s.paidFee;

    document.getElementById("dName").innerText = s.name;
    document.getElementById("dPhone").innerText = s.phone;
    document.getElementById("dCourse").innerText = s.course;
    document.getElementById("dJoinDate").innerText = s.joinDate;
    document.getElementById("dDays").innerText = diffDays;
    document.getElementById("dAutoFee").innerText = "₹" + autoFee;
    document.getElementById("dPaidFee").innerText = "₹" + s.paidFee;
    document.getElementById("dPendingFee").innerText = "₹" + pending;

    document.getElementById("dashboardView").classList.add("hidden");
    document.getElementById("detailView").classList.remove("hidden");

    calculateReceipt();
};

// ૫. લાઈવ પહોંચ ગણતરી
window.calculateReceipt = () => {
    const s = studentsData[currentStudentId];
    if (!s) return;

    const { autoFee } = calculateAutoFee(s.joinDate, s.monthlyFee);
    const pay = parseFloat(document.getElementById("payAmount").value) || 0;
    
    document.getElementById("calcFee").innerText = "₹" + autoFee;
    document.getElementById("calcPaid").innerText = "₹" + pay;
    document.getElementById("calcPending").innerText = "₹" + (autoFee - (s.paidFee + pay));
};

// ૬. ફી જમા કરવી
window.addPayment = () => {
    const s = studentsData[currentStudentId];
    const pay = parseFloat(document.getElementById("payAmount").value) || 0;

    const newPaidTotal = s.paidFee + pay;
    set(ref(db, `students/${currentStudentId}/paidFee`), newPaidTotal).then(() => {
        alert("પહોંચ સફળતાપૂર્વક બની ગઈ અને ફી જમા થઈ ગઈ!");
        openStudentDetail(currentStudentId);
    });
};
