const fs = require('fs');
let code = fs.readFileSync('mobile-seller/src/App.js', 'utf8');

const screensToRemove = [
  'RewardsScreen', 'ReferralScreen', 'MyReviewsScreen',
  'ForumScreen', 'CreateForumPostScreen', 'ForumPostDetailScreen',
  'RecipesScreen', 'RecipeDetailScreen'
];

screensToRemove.forEach(screen => {
  const importRegex = new RegExp(`import .*${screen}.*\\n`, 'g');
  const stackRegex = new RegExp(`.*<Stack\\.Screen.*component={${screen}}.*>\\n`, 'g');
  const stackRegex2 = new RegExp(`.*<Stack\\.Screen.*component={${screen}}.*/>\\n`, 'g');
  
  code = code.replace(importRegex, '');
  code = code.replace(stackRegex, '');
  code = code.replace(stackRegex2, '');
});

fs.writeFileSync('mobile-seller/src/App.js', code, 'utf8');
console.log('Cleaned App.js in mobile-seller');
