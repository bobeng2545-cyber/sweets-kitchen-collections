
/* =========================================
   SWEET'S KITCHEN & COLLECTIONS
   ADMIN AI ASSISTANT INTERFACE
========================================= */

(() => {

    "use strict";

    const launcher =
        document.getElementById("adminAILauncher");

    const panel =
        document.getElementById("adminAIPanel");

    const closeButton =
        document.getElementById("adminAIClose");

    const form =
        document.getElementById("adminAIForm");

    const input =
        document.getElementById("adminAIInput");

    const messages =
        document.getElementById("adminAIMessages");

    const suggestions =
        document.querySelector(".admin-ai-suggestions");


    if (
        !launcher ||
        !panel ||
        !closeButton ||
        !form ||
        !input ||
        !messages
    ) {
        console.warn(
            "Admin AI Assistant elements were not found."
        );
        return;
    }


    function openAssistant() {

        panel.hidden = false;

        launcher.setAttribute(
            "aria-expanded",
            "true"
        );

        input.focus();
    }


    function closeAssistant() {

        panel.hidden = true;

        launcher.setAttribute(
            "aria-expanded",
            "false"
        );

        launcher.focus();
    }


    function addMessage(message, sender) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `admin-ai-message ${sender}`;

        const content =
            document.createElement("div");

        content.className =
            "admin-ai-message-content";

        const paragraph =
            document.createElement("p");

        paragraph.textContent = message;

        content.appendChild(paragraph);

        wrapper.appendChild(content);

        messages.appendChild(wrapper);

        messages.scrollTop =
            messages.scrollHeight;
    }


    function handleMessage(message) {

        addMessage(message, "user");

        addMessage(
            "Thank you. The secure AI connection is not active yet. Once connected, I will analyse your actual store data and provide accurate business information.",
            "assistant"
        );
    }


    launcher.addEventListener(
        "click",
        openAssistant
    );


    closeButton.addEventListener(
        "click",
        closeAssistant
    );


    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const message =
                input.value.trim();

            if (!message) return;

            handleMessage(message);

            input.value = "";

            input.focus();
        }
    );


    if (suggestions) {

        suggestions.addEventListener(
            "click",
            function(event) {

                const button =
                    event.target.closest(
                        "[data-admin-question]"
                    );

                if (!button) return;

                handleMessage(
                    button.dataset.adminQuestion
                );
            }
        );
    }


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape" &&
                !panel.hidden
            ) {
                closeAssistant();
            }
        }
    );


    console.log(
        "Admin AI Assistant interface initialized."
    );

})();
