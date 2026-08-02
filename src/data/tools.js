export const tools = [
  {
    title: 'AI Article Writer',
    description:
      'Generate high-quality, engaging articles on any topic with our AI writing technology.',
    slug: 'article-writer',
    path: '/get-started/ai/article-writer',
    icon: '✎',
    hint: 'Enter the topic, tone, audience, and must-cover points for the article.',
    resultAction: 'copy',
    filterLabel: 'Article length',
    filterOptions: ['100-200 words', '400-600 words', '800-1000 words'],
    defaultFilter: '400-600 words',
  },
  {
    title: 'Blog Title Generator',
    description:
      'Find the perfect, catchy title for your blog posts with our AI-powered generator.',
    slug: 'title-generator',
    path: '/get-started/ai/title-generator',
    icon: '✦',
    hint: 'Describe your post and get catchy title options.',
    resultAction: 'copy',
    filterLabel: 'Title count',
    filterOptions: ['5 titles', '8 titles', '12 titles'],
    defaultFilter: '8 titles',
  },
  {
    title: 'AI Image Generation',
    description:
      'Create stunning visuals with our AI image generation tool. Experience the power of AI.',
    slug: 'image-generation',
    path: '/get-started/ai/image-generation',
    icon: '◎',
    hint: 'Describe the image you want to create.',
    resultAction: 'download',
    filterLabel: 'Image style',
    filterOptions: ['3D image', 'Realistic', 'AI art', 'Illustration', 'Product mockup'],
    defaultFilter: 'Realistic',
  },
  {
    title: 'Background Removal',
    description:
      'Effortlessly remove backgrounds from your images with our AI-driven tool.',
    slug: 'background-removal',
    path: '/get-started/ai/background-removal',
    icon: '◻',
    hint: 'Upload an image to remove its background.',
    resultAction: 'download',
    allowedFileTypes: ['PDF', 'JPEG', 'PNG', 'Image file'],
    defaultFileType: 'PNG',
  },
  {
    title: 'Object Removal',
    description:
      'Remove unwanted objects from your images seamlessly with our AI object removal tool.',
    slug: 'object-removal',
    path: '/get-started/ai/object-removal',
    icon: '◌',
    hint: 'Upload an image and mark objects to remove.',
    resultAction: 'download',
    allowedFileTypes: ['PDF', 'JPEG', 'PNG', 'Image file'],
    defaultFileType: 'PNG',
  },
  {
    title: 'Resume Reviewer',
    description:
      'Get your resume reviewed by AI to improve your chances of landing your dream job.',
    slug: 'resume-reviewer',
    path: '/get-started/ai/resume-reviewer',
    icon: '☰',
    hint: 'Paste your resume for AI feedback and tips.',
    resultAction: 'download',
    allowedFileTypes: ['PDF', 'JPEG', 'PNG', 'Image file'],
    defaultFileType: 'PDF',
  },
]

export function getToolBySlug(slug) {
  return tools.find((tool) => tool.slug === slug)
}
