echo "Running server";
export NODE_ENV=production
while (true); do
    sudo node app >> app.log
    echo "Restarting server";
done