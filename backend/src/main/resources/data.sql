-- Seed 7 demo users (INSERT IGNORE so re-runs are safe)
INSERT INTO users (id, username, display_name, bio, avatar_url, forge_score, diamonds, stars, total_likes, public_repo_count, follower_count, verified)
VALUES
  (1, 'torvalds_demo',  'Linus Torvalds',    'Creator of Linux & Git. Building things that matter.',                          'https://avatars.githubusercontent.com/u/1024025',   320, 4, 12, 80, 0, 0, false),
  (2, 'gvanrossum_demo','Guido van Rossum',   'Python creator. Retired BDFL. Now at Microsoft.',                              'https://avatars.githubusercontent.com/u/2894642',   210, 2, 8,  50, 0, 0, false),
  (3, 'addyosmani_demo','Addy Osmani',        'Engineering Manager @Google Chrome. Author of learning JavaScript Design Patterns.', 'https://avatars.githubusercontent.com/u/110953', 185, 1, 10, 75, 0, 0, false),
  (4, 'dhh_demo',       'DHH',               'Creator of Ruby on Rails. Founder & CTO @37signals.',                         'https://avatars.githubusercontent.com/u/2741',      270, 3, 9,  60, 0, 0, false),
  (5, 'primeagen_demo', 'ThePrimeagen',       'Netflix SWE. Rust/Vim/Neovim enthusiast.',                                    'https://avatars.githubusercontent.com/u/4458174',   195, 2, 7,  55, 0, 0, false),
  (6, 'simonw_demo',    'Simon Willison',     'Co-creator of Django. LLM hacker. Building Datasette.',                       'https://avatars.githubusercontent.com/u/9599',      160, 1, 6,  40, 0, 0, false),
  (7, 'karpathy_demo',  'Andrej Karpathy',   'AI researcher. Former OpenAI/Tesla. Building micrograd.',                     'https://avatars.githubusercontent.com/u/241138',    300, 3, 11, 70, 0, 0, false)
ON CONFLICT (id) DO NOTHING;

-- Advance the sequence past the manually-inserted seed IDs so new rows don't collide
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
