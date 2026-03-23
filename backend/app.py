from flask import Flask, request, jsonify
from flask_cors import CORS
from intent_parser import parse_intent
from rule_engine import add_policy, get_all_policies, delete_policy, check_traffic, get_topology

app = Flask(__name__)
CORS(app)

# 1. Parse intent and add policy
@app.route("/api/intent", methods=["POST"])
def handle_intent():
    data = request.get_json()
    user_input = data.get("intent", "")

    if not user_input:
        return jsonify({"error": "No intent provided"}), 400

    result = parse_intent(user_input)

    if not result["success"]:
        return jsonify({"error": "Failed to parse intent", "details": result}), 500

    policy = add_policy(result["policy"])
    return jsonify({"success": True, "policy": policy})


# 2. Get all active policies
@app.route("/api/policies", methods=["GET"])
def handle_get_policies():
    return jsonify(get_all_policies())


# 3. Delete a policy
@app.route("/api/policies/<policy_id>", methods=["DELETE"])
def handle_delete_policy(policy_id):
    deleted = delete_policy(policy_id)
    if deleted:
        return jsonify({"success": True, "message": f"{policy_id} deleted"})
    return jsonify({"error": "Policy not found"}), 404


# 4. Check if traffic is allowed
@app.route("/api/check", methods=["POST"])
def handle_check_traffic():
    data = request.get_json()
    target = data.get("target", "")
    time = data.get("time", None)

    if not target:
        return jsonify({"error": "No target provided"}), 400

    result = check_traffic(target, current_time=time)
    return jsonify(result)


# 5. Get network topology
@app.route("/api/topology", methods=["GET"])
def handle_topology():
    return jsonify(get_topology())


if __name__ == "__main__":
    app.run(debug=True, port=5000)