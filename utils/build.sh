cd "$(dirname "$0")"
python builder.py deploy_files.txt -o ../build/litegui.min.js -o2 ../build/litegui.js
echo " * CSS packed in ../build/litegui.css"
cat ../src/css/*.css > ../build/litegui.css
chmod a+rw ../build/* 
