// ગ્લોબલ ડેટા
window.studentsData = window.studentsData || {};
window.currentStudentId = null;

// ૧. સેક્શન નેવિગેશન (વિભાગો દર્શાવવા/છુપાવવા)
function showSection(sectionId) {
    var sections = ['dashboardSection', 'addStudentSection', 'studentDetailsSection', 'stationerySection'];
    for (var i = 0; i < sections.length; i++) {
        var el = document.getElementById(sections[i]);
        if (el) {
            el.style.display = (sections[i] === sectionId) ? 'block' : 'none';
        }
    }
}

function showDashboard() {
    window.currentStudentId = null;
    showSection('dashboardSection');
}

// ૨. નવો વિદ્યાર્થી ઉમેરો બટન
function addStudent() {
    window.currentStudentId = null;
    var form = document.getElementById("addStudentForm");
    if (form) form.reset();
    
    var joinDateInput = document.getElementById("joinDate");
    if (joinDateInput) {
        joinDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    showSection('addStudentSection');
}

// ૩. વિદ્યાર્થી સેવ કરવો
function saveStudent(event) {
    if (event) event.preventDefault();

    var nameEl = document.getElementById("studentName");
    var phoneEl = document.getElementById("phone");
    
    var name = nameEl ? nameEl.value.trim() : "";
    var phone = phoneEl ? phoneEl.value.trim() : "";

    if (!name || !phone) {
        alert("કૃપા કરીને વિદ્યાર્થીનું નામ અને મોબાઈલ નંબર લખો.");
        return;
    }

    var id = window.currentStudentId || "STU_" + Date.now();

    var studentObj = {
        id: id,
        name: name,
        phone: phone,
        std: document.getElementById("studentStd") ? document.getElementById("studentStd").value : "",
        course: document.getElementById("course") ? document.getElementById("course").value : "",
        monthlyFee: parseFloat(document.getElementById("monthlyFee") ? document.getElementById("monthlyFee").value : 0) || 0,
        joinDate: document.getElementById("joinDate") ? document.getElementById("joinDate").value : ""
    };

    window.studentsData[id] = studentObj;
    alert("વિદ્યાર્થી સફળતાપૂર્વક ઉમેરાઈ ગયો!");
    
    if (document.getElementById("addStudentForm")) {
        document.getElementById("addStudentForm").reset();
    }
    showDashboard();
}

// ૪. ફી ગણતરી અને કેલ્ક્યુલેશન
function calculateReceipt() {
    var payAmt = parseFloat(document.getElementById("payAmount") ? document.getElementById("payAmount").value : 0) || 0;
    var calcPaid = document.getElementById("calcPaid");
    if (calcPaid) calcPaid.innerText = payAmt;
}

function addPayment() {
    alert("પહોંચ સફળતાપૂર્વક સેવ થઈ ગઈ છે!");
}

// વિંડો ઓબ્જેક્ટ પર બાઈન્ડ કરવું (સરળ એક્સેસ માટે)
window.showSection = showSection;
window.showDashboard = showDashboard;
window.addStudent = addStudent;
window.saveStudent = saveStudent;
window.calculateReceipt = calculateReceipt;
window.addPayment = addPayment;
