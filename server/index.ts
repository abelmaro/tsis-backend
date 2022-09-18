import express from 'express';
import routes from '../source/routes/scrap'
const router = express();

router.use('/api', routes);

const PORT = process.env.PORT ?? 6060;
router.listen(PORT, () => console.log(`Server run on port ${PORT}`));

module.exports = router;