
const SUPABASE_URL = "https://vbrlprrbtumonmroybdv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QN5w738LNyUrYy2X93M1OQ_md6F2xTN";

const authClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.sweetSupabase = authClient;

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const statusMessage = document.getElementById("statusMessage");

function showMessage(message, isError = false) {
    if (!statusMessage) {
        alert(message);
        return;
    }

    statusMessage.textContent = message;
    statusMessage.hidden = false;
    statusMessage.classList.toggle("info", !isError);
}

function switchMode(mode) {
    const registering = mode === "register";

    if (loginForm) loginForm.hidden = registering;
    if (registerForm) registerForm.hidden = !registering;

    if (loginTab) loginTab.classList.toggle("active", !registering);
    if (registerTab) registerTab.classList.toggle("active", registering);

    const heading = document.querySelector(".form-heading h2");
    const description = document.querySelector(
        ".form-heading > p:last-child"
    );

    if (heading) {
        heading.textContent = registering ? "Create Account" : "Welcome Back";
    }

    if (description) {
        description.textContent = registering
            ? "Create your account to get started."
            : "Sign in to continue to your account.";
    }

    if (statusMessage) {
        statusMessage.hidden = true;
        statusMessage.textContent = "";
    }
}

loginTab?.addEventListener("click", () => switchMode("login"));
registerTab?.addEventListener("click", () => switchMode("register"));

document.querySelectorAll(".inline-switch").forEach((button) => {
    button.addEventListener("click", () => {
        switchMode(button.dataset.mode);
    });
});

// Show or hide password fields
document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.target);
        if (!target) return;

        const showing = target.type === "text";
        target.type = showing ? "password" : "text";
        button.textContent = showing ? "Show" : "Hide";
    });
});

// Create account
registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const termsAccepted = document.getElementById("agreeTerms")?.checked;
    const submitButton = registerForm.querySelector(
        'button[type="submit"], button:not([type])'
    );

    if (!fullName || !email || !password || !confirmPassword) {
        showMessage("Please complete all required fields.", true);
        return;
    }

    if (password.length < 6) {
        showMessage("Your password must contain at least 6 characters.", true);
        return;
    }

    if (password !== confirmPassword) {
        showMessage("The passwords do not match.", true);
        return;
    }

    if (!termsAccepted) {
        showMessage("Please accept the terms before creating an account.", true);
        return;
    }

    if (submitButton) submitButton.disabled = true;
    showMessage("Creating your account...");

    try {
        const { data, error } = await authClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                },
               emailRedirectTo: new URL("./index.html", window.location.href).href
            }
        });

        if (error) throw error;

        if (data.session) {
            showMessage("Account created successfully. Opening your account...");
            window.location.href = "index.html";
        } else {
            registerForm.reset();
            
            // Switch to the login form first.
            switchMode("login");
            
            // Then display the success message.
            showMessage(
                "Account created! Check your email for the confirmation link before signing in."
            );
        }
    
    } catch (error) {
        showMessage(error.message || "Unable to create your account.", true);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

/* SIGN IN */
loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    const submitButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    if (!email || !password) {
        showMessage("Enter your email and password.", true);
        return;
    }

    if (!window.sweetSupabase) {
        showMessage("Supabase is not initialized. Check your setup.", true);
        console.error("Supabase client is missing.");
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";
    }

    try {
        const { data, error } =
            await window.sweetSupabase.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Sign-in failed. Please try again.");
        }

        showMessage("Login successful. Opening your account...");

        window.location.href = "./index.html";

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



// Forgot password
document.getElementById("forgotButton")?.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail")?.value.trim();

    if (!email) {
        showMessage(
            "Enter your email address in the login email field first.",
            true
        );
        return;
    }

    try {
        const { error } = await authClient.auth.resetPasswordForEmail(email, {
            redirectTo: new URL("./login.html", window.location.href).href
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
});

// Initial view
switchMode("login");
