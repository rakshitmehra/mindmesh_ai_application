const app = require("./app")

const port = process.env.PORT || 5000

require('dotenv').config();

app.listen(port, () =>
  console.log(`Server listening on port ${port}`)
)
