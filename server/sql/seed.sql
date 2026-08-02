USE workmate;

INSERT INTO tools (slug, title, description, icon, hint, result_action, category, sort_order)
VALUES
  (
    'article-writer',
    'AI Article Writer',
    'Generate high-quality, engaging articles on any topic with our AI writing technology.',
    '✎',
    'Enter a topic and tone to draft a full article.',
    'copy',
    'writing',
    1
  ),
  (
    'title-generator',
    'Blog Title Generator',
    'Find the perfect, catchy title for your blog posts with our AI-powered generator.',
    '✦',
    'Describe your post and get catchy title options.',
    'copy',
    'writing',
    2
  ),
  (
    'image-generation',
    'AI Image Generation',
    'Create stunning visuals with our AI image generation tool. Experience the power of AI.',
    '◎',
    'Describe the image you want to create.',
    'download',
    'image',
    3
  ),
  (
    'background-removal',
    'Background Removal',
    'Effortlessly remove backgrounds from your images with our AI-driven tool.',
    '◻',
    'Upload an image to remove its background.',
    'download',
    'image',
    4
  ),
  (
    'object-removal',
    'Object Removal',
    'Remove unwanted objects from your images seamlessly with our AI object removal tool.',
    '◌',
    'Upload an image and mark objects to remove.',
    'download',
    'image',
    5
  ),
  (
    'resume-reviewer',
    'Resume Reviewer',
    'Get your resume reviewed by AI to improve your chances of landing your dream job.',
    '☰',
    'Paste your resume for AI feedback and tips.',
    'download',
    'resume',
    6
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  icon = VALUES(icon),
  hint = VALUES(hint),
  result_action = VALUES(result_action),
  category = VALUES(category),
  sort_order = VALUES(sort_order),
  is_active = 1;

INSERT INTO testimonials (quote, author_name, company, rating, published_on)
SELECT * FROM (
  SELECT
    'PrebuiltUI helps me build clean and responsive interfaces faster without compromising design quality.' AS quote,
    'James Bond' AS author_name,
    'Amazon.com, Inc.' AS company,
    5 AS rating,
    '2026-06-10' AS published_on
  UNION ALL
  SELECT
    'These Tailwind components saved me countless hours while maintaining a polished and professional look.',
    'Emily Rodriguez',
    'The Walt Disney Company',
    5,
    '2026-06-10'
  UNION ALL
  SELECT
    'PrebuiltUI makes frontend development faster, simpler and far more enjoyable for website projects.',
    'Jack',
    'Facebook, Inc.',
    5,
    '2026-06-10'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM testimonials LIMIT 1);
