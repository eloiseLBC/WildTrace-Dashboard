import express from "express";
import cors from "cors";

import { getEnvironmentalCaptures } from "./services/environmentalService.js";

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json());


// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "WildTrace API",
    });
});


// --------------------------------------------------
// Environmental
// --------------------------------------------------

app.get("/api/environmental/captures", async (req, res) => {
    try {
        console.log("\nGET /api/environmental/captures");

        const captures = await getEnvironmentalCaptures();

        res.json(captures);
    } catch (error) {
        console.error(
            "[Environmental] Erreur :",
            error
        );

        res.status(500).json({
            error: "Unable to retrieve environmental data",
        });
    }
});


app.listen(PORT, () => {
    console.log("------------------------------------");
    console.log("WildTrace API started");
    console.log(`http://localhost:${PORT}`);
    console.log("------------------------------------");
});