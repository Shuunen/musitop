## by default, script is executed in directory where it is called
## so... call this shell script like :
# sh /home/YOU/Projects/musitop/shortcuts/musinext.sh

HERE=$(dirname $0)
cd $HERE/..
node build/src/client next-song

# date > $HERE/musinext.log
# whereis node >> $HERE/musinext.log
## if node is not find maybe you'll need to make it globally available :
# whereis node
## should give you this : "/hey/a/path/to/node"
## else run :
# sudo ln -s /hey/a/path/to/node /usr/bin/node

