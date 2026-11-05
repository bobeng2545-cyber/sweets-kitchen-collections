
/* =========================================
   SWEET'S KITCHEN & COLLECTIONS
   CUSTOMER AI ASSISTANT INTERFACE
========================================= */

(() => {

    "use strict";

    const launcher =
        document.getElementById("customerAILauncher");

    const panel =
        document.getElementById("customerAIPanel");

    const closeButton =
        document.getElementById("customerAIClose");

    const form =
        document.getElementById("customerAIForm");

    const input =
        document.getElementById("customerAIInput");

    const messages =
        document.getElementById("customerAIMessages");

    const suggestions =
        document.querySelector(".customer-ai-suggestions");


    /* CHECK REQUIRED ELEMENTS */

    if (
        !launcher ||
        !panel ||
        !closeButton ||
        !form ||
        !input ||
        !messages
    ) {

        console.warn(
            "Customer AI Assistant HTML elements were not found."
        );

        return;
    }


    /* OPEN ASSISTANT */

    function openAssistant() {

        panel.hidden = false;

        launcher.setAttribute(
            "aria-expanded",
            "true"
        );

        input.focus();

    }


    /* CLOSE ASSISTANT */

    function closeAssistant() {

        panel.hidden = true;

        launcher.setAttribute(
            "aria-expanded",
            "false"
        );

        launcher.focus();

    }


    /* ADD A MESSAGE */

    function addMessage(message, sender) {

        const messageWrapper =
            document.createElement("div");

        messageWrapper.className =
            `customer-ai-message ${sender}`;


        if (sender === "assistant") {

            const avatar =
                document.createElement("div");

            avatar.className =
                "customer-ai-message-avatar";

            const icon =
                document.createElement("span");

            icon.className =
                "material-symbols-outlined";

            icon.textContent = "smart_toy";

            avatar.appendChild(icon);

            messageWrapper.appendChild(avatar);

        }


        const content =
            document.createElement("div");

        content.className =
            "customer-ai-message-content";

        const paragraph =
            document.createElement("p");

        /*
           textContent prevents user messages
           from being interpreted as HTML.
        */

        paragraph.textContent = message;

        content.appendChild(paragraph);

        messageWrapper.appendChild(content);

        messages.appendChild(messageWrapper);

        messages.scrollTop =
            messages.scrollHeight;

    }


    /* HANDLE CUSTOMER MESSAGE */

    function handleCustomerMessage(message) {

        addMessage(message, "user");

        /*
           OpenAI connection has not yet been
           configured. Do not pretend this is
           a real AI response.
        */

        addMessage(
            "Thanks for your question! Our AI connection is not activated yet. We are setting up the assistant so it can provide accurate answers using our actual store products and information.",
            "assistant"
        );

    }


    /* OPEN BUTTON */

    launcher.addEventListener(
        "click",
        openAssistant
    );


    /* CLOSE BUTTON */

    closeButton.addEventListener(
        "click",
        closeAssistant
    );


    /* SEND MESSAGE */

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const message =
                input.value.trim();

            if (!message) return;

            handleCustomerMessage(message);

            input.value = "";

            input.focus();

        }
    );


    /* QUICK SUGGESTIONS */

    if (suggestions) {

        suggestions.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-ai-question]"
                    );

                if (!button) return;

                const question =
                    button.dataset.aiQuestion;

                handleCustomerMessage(question);

            }
        );

    }


    /* CLOSE WITH ESCAPE */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                !panel.hidden
            ) {

                closeAssistant();

            }

        }
    );


    console.log(
        "Customer AI Assistant interface initialized."
    );

})();
