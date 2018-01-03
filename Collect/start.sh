echo "Running server";
while (true); do
    sudo node app >> app.log
    echo "Restarting server";
done