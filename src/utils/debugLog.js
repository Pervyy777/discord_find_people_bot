module.exports = (state,...args) => {
    switch(state) {
        case 'i':
            if(process.env.DEBUG){
                console.log("info: " + args );
            }
            break;
        case 'w':
            console.log("\x1b[32m" + "warning: " + args );
            break;
        case 'e':
            console.log("\x1b[31m" + "error: "  + args);
            break;
        default:
            console.log("\x1b[31m" + "error: "  + "the state for debugLog is not found");
    }
}