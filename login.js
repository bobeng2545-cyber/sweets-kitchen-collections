/* =====================================================
   SWEET's KITCHEN & COLLECTIONS
   LOGIN AND REGISTRATION
===================================================== */

const SUPABASE_URL =
    "https://vbrlprrbtumonmroybdv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_jOGj9C6m_fFryLL8yrcQmw_5wyZoidy";


/* =====================================================
   1. INITIALIZE SUPABASE
===================================================== */

if (!window.supabase) {

    console.error("Supabase library was not loaded.");

    alert("The login service could not load. Please refresh the page.");

    throw new Error("Supabase library is missing.");

}

const authClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

window.sweetSupabase = authClient;


/* =====================================================
   2. GET HTML ELEMENTS
===================================================== */

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const statusMessage = document.getElementById("statusMessage");


/* =====================================================
   3. DISPLAY STATUS MESSAGES
===================================================== */

function showMessage(message, isError = false) {

    if (!statusMessage) {
        alert(message);
        return;
    }

    statusMessage.textContent = message;
    statusMessage.hidden = false;

    statusMessage.classList.toggle("error", isError);
    statusMessage.classList.toggle("info", !isError);

}


/* =====================================================
   4. SWITCH BETWEEN LOGIN AND REGISTRATION
===================================================== */

function switchMode(mode) {

    const registering = mode === "register";

    if (loginForm) {
        loginForm.hidden = registering;
    }

    if (registerForm) {
        registerForm.hidden = !registering;
    }

    if (loginTab) {

        loginTab.classList.toggle("active", !registering);

        loginTab.setAttribute(
            "aria-selected",
            String(!registering)
        );

    }

    if (registerTab) {

        registerTab.classList.toggle("active", registering);

        registerTab.setAttribute(
            "aria-selected",
            String(registering)
        );

    }

    const eyebrow = document.getElementById("form-eyebrow");
    const heading = document.getElementById("form-title");
    const description = document.getElementById("form-subtitle");

    if (eyebrow) {
        eyebrow.textContent = registering
            ? "JOIN SWEET'S"
            : "WELCOME BACK";
    }

    if (heading) {
        heading.textContent = registering
            ? "Create your account"
            : "Sign in to your account";
    }

    if (description) {
        description.textContent = registering
            ? "Enter your details to create an account."
            : "Enter your details below to continue.";
    }

    if (statusMessage) {

        statusMessage.hidden = true;
        statusMessage.textContent = "";

        statusMessage.classList.remove("error", "info");

    }

}


loginTab?.addEventListener("click", function () {
    switchMode("login");
});

registerTab?.addEventListener("click", function () {
    switchMode("register");
});


document.querySelectorAll(".inline-switch").forEach(function (button) {

    button.addEventListener("click", function () {

        switchMode(button.dataset.mode);

    });

});


/* =====================================================
   5. SHOW OR HIDE PASSWORD
===================================================== */

document.querySelectorAll(".password-toggle").forEach(function (button) {

    button.addEventListener("click", function () {

        const target = document.getElementById(
            button.dataset.target
        );

        if (!target) return;

        const showing = target.type === "text";

        target.type = showing ? "password" : "text";

        button.textContent = showing ? "Show" : "Hide";

        button.setAttribute(
            "aria-label",
            showing ? "Show password" : "Hide password"
        );

    });

});


/* =====================================================
   6. VALIDATE EMAIL
===================================================== */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* =====================================================
   7. CREATE ACCOUNT
===================================================== */

registerForm?.addEventListener("submit", async function (event) {

    event.preventDefault();

    const fullName =
        document.getElementById("fullName")?.value.trim() || "";

    const email =
        document.getElementById("registerEmail")?.value.trim() || "";

    const phone =
        document.getElementById("registerPhone")?.value.trim() || "";

    const password =
        document.getElementById("registerPassword")?.value || "";

    const confirmPassword =
        document.getElementById("confirmPassword")?.value || "";

    const termsAccepted =
        document.getElementById("agreeTerms")?.checked || false;

    const submitButton =
        registerForm.querySelector('button[type="submit"]');

    /* Validate required fields */

    if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword
    ) {

        showMessage("Please complete all required fields.", true);
        return;

    }

    if (fullName.length < 2) {

        showMessage("Please enter your full name.", true);
        return;

    }

    if (!isValidEmail(email)) {

        showMessage("Please enter a valid email address.", true);
        return;

    }

    if (password.length < 8) {

        showMessage(
            "Your password must contain at least 8 characters.",
            true
        );

        return;

    }

    if (password !== confirmPassword) {

        showMessage("The passwords do not match.", true);
        return;

    }

    if (!termsAccepted) {

        showMessage(
            "Please accept the terms before creating an account.",
            true
        );

        return;

    }

    if (submitButton) {

        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

    }

    showMessage("Creating your account...");

    try {

        const { data, error } = await authClient.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {

                    full_name: fullName,

                    phone: phone

                },

                emailRedirectTo: new URL(
                    "./index.html",
                    window.location.href
                ).href

            }

        });

        if (error) {
            throw error;
        }

        if (data.session && data.user) {

            showMessage(
                "Account created successfully. Opening your account..."
            );

            window.location.replace("./index.html");

            return;

        }

        registerForm.reset();

        switchMode("login");

        showMessage(
            "Your account has been created. Please check your email and confirm your address before signing in."
        );

    } catch (error) {

        console.error("Registration failed:", error);

        showMessage(
            error.message || "Unable to create your account.",
            true
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                'Create account <span aria-hidden="true">→</span>';

        }

    }

});


/* =====================================================
   8. SIGN IN
===================================================== */

loginForm?.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail")?.value.trim() || "";

    const password =
        document.getElementById("loginPassword")?.value || "";

    const submitButton =
        loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {

        showMessage("Enter your email and password.", true);
        return;

    }

    if (!isValidEmail(email)) {

        showMessage("Please enter a valid email address.", true);
        return;

    }

    if (submitButton) {

        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";

    }

    showMessage("Checking your account...");

    try {

        const { data, error } =
            await authClient.auth.signInWithPassword({

                email: email,

                password: password

            });

        if (error) {
            throw error;
        }

        if (!data.user || !data.session) {

            throw new Error(
                "A valid login session was not created. Please try again."
            );

        }

        /*
         * Confirm that the session is available in the
         * browser before redirecting to the homepage.
         */

        const { data: sessionData, error: sessionError } =
            await authClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData.session) {

            throw new Error(
                "Your login session could not be saved. Please try again."
            );

        }

        console.log("Login successful.");
        console.log("Signed-in email:", sessionData.session.user.email);
        console.log("Session exists:", !!sessionData.session);

        showMessage("Login successful. Opening your account...");

        window.location.replace("./index.html");

    } catch (error) {

        console.error("Sign-in failed:", error);

        showMessage(
            error.message || "Unable to sign in. Please try again.",
            true
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.innerHTML =
                'Sign in <span aria-hidden="true">→</span>';

        }

    }

});


/* =====================================================
   9. FORGOT PASSWORD
===================================================== */

document.getElementById("forgotButton")?.addEventListener(
    "click",
    async function () {

        const email =
            document.getElementById("loginEmail")?.value.trim() || "";

        if (!email) {

            showMessage(
                "Enter your email address in the login email field first.",
                true
            );

            return;

        }

        if (!isValidEmail(email)) {

            showMessage("Please enter a valid email address.", true);
            return;

        }

        showMessage("Requesting password reset...");

        try {

            const { error } =
                await authClient.auth.resetPasswordForEmail(email, {

                    redirectTo: new URL(
                        "./login.html",
                        window.location.href
                    ).href

                });

            if (error) {
                throw error;
            }

            showMessage(
                "If an account exists for that email, a password reset link will be sent."
            );

        } catch (error) {

            console.error("Password reset failed:", error);

            showMessage(
                error.message || "Could not request a password reset.",
                true
            );

        }

    }
);


/* =====================================================
   10. TERMS LINK
===================================================== */

document.getElementById("termsLink")?.addEventListener(
    "click",
    function (event) {

        event.preventDefault();

        showMessage(
            "Please contact the store for its terms of use."
        );

    }
);


/* =====================================================
   11. INITIAL PAGE VIEW
===================================================== */

switchMode("login");

console.log("Sweet's login system initialized.");
