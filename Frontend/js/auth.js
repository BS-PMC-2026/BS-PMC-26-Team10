// tabs
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

// forms
const loginForm = document.getElementById("login");
const signupForm = document.getElementById("signup");

// switch links
const goSignup = document.getElementById("goSignup");
const goLogin = document.getElementById("goLogin");

// buttons
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const guestBtn = document.getElementById("guestBtn");

// ---- SWITCH BETWEEN FORMS ----
function showLogin() {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");
}

function showSignup() {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");

    signupTab.classList.add("active");
    loginTab.classList.remove("active");
}

// tab clicks
loginTab.addEventListener("click", showLogin);
signupTab.addEventListener("click", showSignup);

// text clicks
goSignup.addEventListener("click", showSignup);
goLogin.addEventListener("click", showLogin);


// ---- LOGIN (FAKE FOR NOW) ----
loginBtn.addEventListener("click", function () {
    const email = document.getElementById("loginEmail").value;

    // simple demo logic
    if (email.includes("admin")) {
        window.location.href = "pages/OwnerMain.html";
    } 
    else if (email.includes("worker")) {
        window.location.href = "pages/TourguideMain.html";
    } 
    else {
        window.location.href = "pages/VisitorMain.html";
    }
});


// ---- SIGNUP ----
signupBtn.addEventListener("click", function () {
    const role = document.getElementById("role").value;

    if (role === "admin") {
        window.location.href = "pages/OwnerMain.html";
    } 
    else if (role === "worker") {
        window.location.href = "pages/TourguideMain.html";
    } 
    else {
        window.location.href = "pages/VisitorMain.html";
    }
});


// ---- GUEST ----
guestBtn.addEventListener("click", function () {
    window.location.href = "pages/VisitorMain.html";
});