cd dist
git init
git add .
New-Item -ItemType File -Name ".nojekyll"
git add .nojekyll
git commit -m "Clean deploy"
git push https://github.com/piotrpallach1985-coder/Serwis-CRIST.git master:main -f
cd ..
