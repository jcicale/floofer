package com.juliacicale.floofer.CustomPluginFloofer;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class echoes a string called from JavaScript.
 */

public class CustomPluginFloofer extends CordovaPlugin {

    public static final String ACTION_GET_PUP = "getPup";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (ACTION_GET_PUP.equals(action)) {
            JSONObject arg_object = args.getJSONObject(0);
            String pup = arg_object.getString("pup");
            String result = "Your daily pup: "+pup;
            callbackContext.success(result);
            return true;
            }
        callbackContext.error("Invalid action requested");
        return false;
    }
}


