echo "Running server";

while (true); do
    node app production >> app.log
    echo "Restarting server";
done