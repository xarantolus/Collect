echo "Running server";

while (true); do
    # The number in the line below sets the maximum memory limit for the JavaScript engine.
	# If you don't set this option, the maximum size is 512mb
    node --max-old-space-size=800 app production >> app.log
    echo "Restarting server";
done