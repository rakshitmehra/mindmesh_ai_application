const gemini = require("../config/gemini");

module.exports = {
  async sendText(req, res) {
    try {
      const { prompt } = req.body;

      const response = await gemini.textCompletion({ prompt });

      const generatedText =
        response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      return res.status(200).json({
        success: true,
        data: generatedText,
      });
    } catch (error) {
      console.error("Gemini API Error:", error?.response?.data || error.message);

      return res.status(400).json({
        success: false,
        error: error?.response?.data || "There was an issue on the server",
      });
    }
  },
};
