import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
export const forumPostData = [
  {
    category: 'Development Talk',
    title: "What's the best JavaScript framework in 2025?",
    description: 'With so many frameworks available, developers often debate which one offers the best balance of performance, scalability, and ease of use. Share your thoughts!',
    author: {
      name: 'James Milton',
      image: user5,
    },
    timeStamp: '1 hour ago',
    answers: 45,
    votes: 732,
    timeLeft: '3 days',
    badge: {
      className: 'bg-success',
      text: 'New',
    },
  },
  {
    category: 'AI & Ethics',
    title: 'Should AI tools be regulated by governments?',
    description: 'As AI becomes more powerful, discussions around ethics and control are growing. What’s your take on government involvement?',
    author: {
      name: 'Amira Lee',
      image: user8,
    },
    timeStamp: '2 hours ago',
    answers: 62,
    votes: 894,
    timeLeft: '4 days',
    badge: {
      className: 'bg-warning',
      text: '23',
    },
  },
  {
    category: 'Product Design',
    title: 'Is minimalism still relevant in modern UI design?',
    description: 'Clean interfaces have been a trend for years, but some argue they now lack innovation. What’s your opinion?',
    author: {
      name: 'Liam Carter',
      image: user2,
    },
    timeStamp: '3 hours ago',
    answers: 31,
    votes: 410,
    timeLeft: '2 days',
    badge: {
      className: 'bg-primary',
      text: '8',
    },
  },
  {
    category: 'Career Growth',
    title: 'What’s better for growth: startups or large companies?',
    description: 'Both have pros and cons—startups offer agility, while big companies provide stability. Which helped your career most?',
    author: {
      name: 'Noah Bennett',
      image: user6,
    },
    timeStamp: '5 hours ago',
    answers: 50,
    votes: 612,
    timeLeft: '1 day',
    badge: {
      className: 'bg-primary',
      text: '12',
    },
  },
  {
    category: 'DevOps',
    title: 'CI/CD or traditional release cycles: what works better?',
    description: "Continuous deployment speeds up delivery, but some teams prefer slower, stable releases. What’s your team's approach?",
    author: {
      name: 'Sofia Kim',
      image: user4,
    },
    timeStamp: '8 hours ago',
    answers: 76,
    votes: 1005,
    timeLeft: '6 days',
    badge: {
      className: 'bg-secondary',
      text: '18',
    },
  },
  {
    category: 'Open Source',
    title: 'What’s the best way to start contributing to open source?',
    description: 'Many developers want to join the open-source movement but don’t know where to begin. What advice would you give?',
    author: {
      name: 'Daniel Reed',
      image: user1,
    },
    timeStamp: '12 minutes ago',
    answers: 39,
    votes: 558,
    timeLeft: '7 days',
    badge: {
      className: 'bg-dark',
      text: '7',
    },
  },
]
