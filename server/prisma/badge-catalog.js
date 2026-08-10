const BADGES = [
  { name: "First Visit", description: "Completed your first dental visit", icon: "🎉", category: "Milestone", threshold: 1, points: 20 },
  { name: "Regular Visitor", description: "Attended 3 or more visits", icon: "⭐", category: "Loyalty", threshold: 3, points: 40 },
  { name: "Loyal Patient", description: "Attended 10 visits", icon: "💎", category: "Loyalty", threshold: 10, points: 80 },
  { name: "VIP Patient", description: "Attended 20 visits", icon: "👑", category: "Loyalty", threshold: 20, points: 150 },
  { name: "Committed Patient", description: "Completed 5 treatments", icon: "🏆", category: "Achievement", threshold: 5, points: 50 },
  { name: "Cavity-Free Checkup", description: "3 checkups with no decay found", icon: "🦷", category: "Achievement", threshold: 3, points: 30 },
  { name: "Whiter Smile", description: "Had a whitening treatment", icon: "✨", category: "Achievement", threshold: 1, points: 25 },
  { name: "Full Assessment", description: "Had a comprehensive dental exam", icon: "📋", category: "Achievement", threshold: 1, points: 25 },
  { name: "Streak Master", description: "Visited 3 months in a row", icon: "🔥", category: "Dedication", threshold: 3, points: 40 },
  { name: "Early Bird", description: "3 appointments before 10 AM", icon: "🌅", category: "Habit", threshold: 3, points: 20 },
  { name: "Ahead of Schedule", description: "Booked 3 appointments 7+ days ahead", icon: "📅", category: "Habit", threshold: 3, points: 30 },
  { name: "Friend Referral", description: "Referred a friend to the clinic", icon: "🤝", category: "Referral", threshold: 1, points: 50 },
];

module.exports = { BADGES };
