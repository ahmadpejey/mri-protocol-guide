/**
 * API Service Layer | M3 Architecture
 * Powered by Cloudflare Workers & D1 Database (Szalted)
 */

const API_CONFIG = {
    // ⚠️ REPLACE THIS WITH YOUR ACTUAL WORKER URL ⚠️
    BASE_URL: 'https://mri-api.szalted.workers.dev', 
};

const ApiService = {
    async fetchAllData() {
        try {
            const response = await fetch(API_CONFIG.BASE_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message);
            return result.data;
        } catch (error) {
            console.error("Database Connection Failed:", error);
            return { groups: [], protocols: [], sequences: [], globals: [] };
        }
    },

    async saveData(sheetName, dataArray) {
        try {
            const response = await fetch(API_CONFIG.BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSheet',
                    sheetName: sheetName,
                    data: dataArray
                })
            });

            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message);
            return true;
        } catch (error) {
            console.error("Failed to save data:", error);
            alert("Error saving data. Check console.");
            return false;
        }
    }
};

window.ApiService = ApiService;