const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;
    const category = req.query.category || '';

    let sql = 'SELECT id, title, slug, excerpt, image_url, category, published_at FROM news WHERE is_active=1';
    const params = [];
    if (category) { sql += ' AND category=?'; params.push(category); }
    sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const countSql = category
      ? 'SELECT COUNT(*) AS total FROM news WHERE is_active=1 AND category=?'
      : 'SELECT COUNT(*) AS total FROM news WHERE is_active=1';
    const countParams = category ? [category] : [];

    const [newsList, countResult] = await Promise.all([
      db.query(sql, params),
      db.queryOne(countSql, countParams)
    ]);

    const total = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(total / limit);

    res.render('news', {
      title: 'Tin Tức',
      newsList,
      page,
      totalPages,
      category
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.detail = async (req, res) => {
  try {
    const article = await db.queryOne(
      'SELECT * FROM news WHERE slug=? AND is_active=1',
      [req.params.slug]
    );
    if (!article) return res.status(404).render('404', { title: 'Không tìm thấy' });

    const related = await db.query(
      'SELECT id, title, slug, image_url, published_at FROM news WHERE is_active=1 AND id!=? ORDER BY published_at DESC LIMIT 3',
      [article.id]
    );

    res.render('news-detail', { title: article.title, article, related });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};
