async function test() {
    console.log("Connecting to API...");
    try {
        const response = await fetch("https://cymonic-api.onrender.com/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputText: "Acme Corp is launching the TerraPhone X, a $799 smartphone aimed at Gen Z creators." })
        });

        console.log("Status:", response.status);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            console.log("STREAM:", decoder.decode(value, { stream: true }));
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
