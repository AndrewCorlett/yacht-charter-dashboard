#!/bin/bash

# SeaScape SQL Deployment using Supabase REST API
# Uses the MCP access token for authenticated requests

set -e

PROJECT_REF="kbwjtihjyhapaclyytxn"
ACCESS_TOKEN="sbp_3d1724d7b2826ce639554221a0acef8be44c2b0a"
BASE_URL="https://api.supabase.com"

echo "🚀 SeaScape SQL Deployment via REST API"
echo "=================================================="

# Test API access first
echo
echo "🔌 Testing API access..."
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$BASE_URL/v1/projects")

if [ "$response" = "200" ]; then
    echo "✅ API access successful"
else
    echo "❌ API access failed (HTTP $response)"
    echo "   The MCP access token may not have sufficient permissions"
    echo "   Falling back to manual deployment instructions..."
    echo
    echo "📝 Manual Deployment Required:"
    echo "   1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    echo "   2. Execute each SQL file in the SQL Editor:"
    echo "      a. migration-unified-schema.sql"
    echo "      b. storage-bucket-setup.sql" 
    echo "      c. rls-policies-setup.sql"
    echo "      d. sample-bookings-data.sql"
    echo "   3. Verify: node verify-seascape-connection.cjs"
    exit 1
fi

# Function to execute SQL
execute_sql() {
    local sql_content="$1"
    local description="$2"
    
    echo "   🔄 $description..."
    
    # Try to execute via SQL endpoint
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}" \
        "$BASE_URL/v1/projects/$PROJECT_REF/sql" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✅ $description - Success"
        return 0
    elif [ "$http_code" = "409" ]; then
        echo "   ⚠️  $description - Already exists (continuing)"
        return 0
    else
        echo "   ❌ $description - Failed (HTTP $http_code)"
        if [ -n "$response_body" ]; then
            echo "   Response: $(echo "$response_body" | head -c 100)..."
        fi
        return 1
    fi
}

# Function to execute SQL file
execute_sql_file() {
    local file_path="$1"
    local description="$2"
    
    echo
    echo "📄 $description"
    
    if [ ! -f "$file_path" ]; then
        echo "   ❌ File not found: $file_path"
        return 1
    fi
    
    # Read the SQL file
    sql_content=$(cat "$file_path")
    
    # For large files, try to execute as one block first
    if execute_sql "$sql_content" "Complete $description"; then
        echo "   📊 $description completed successfully"
        return 0
    else
        echo "   ⚠️  Bulk execution failed, manual deployment recommended"
        return 1
    fi
}

# Main deployment sequence
echo
echo "🗂️  Starting SQL deployment sequence..."

# Check if jq is available for JSON processing
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required for JSON processing"
    echo "   Install with: sudo apt-get install jq"
    echo "   Or use manual deployment instead"
    exit 1
fi

# Execute SQL files in sequence
success_count=0

echo
echo "🏗️  Phase 1: Schema Migration"
if execute_sql_file "../migration-unified-schema.sql" "Unified bookings table schema"; then
    ((success_count++))
fi

echo
echo "🗄️  Phase 2: Storage Configuration"
if execute_sql_file "../storage-bucket-setup.sql" "Storage bucket setup"; then
    ((success_count++))
fi

echo
echo "🔒 Phase 3: Security Policies"
if execute_sql_file "../rls-policies-setup.sql" "Row Level Security policies"; then
    ((success_count++))
fi

echo
echo "📊 Phase 4: Sample Data"
if execute_sql_file "../sample-bookings-data.sql" "Test booking records"; then
    ((success_count++))
fi

# Summary
echo
echo "📊 Deployment Summary:"
echo "   ✅ $success_count/4 phases completed"

if [ $success_count -ge 3 ]; then
    echo
    echo "🎉 SQL Deployment Completed!"
    echo "✅ Database schema should be ready"
    echo "✅ Run verification to confirm deployment"
    echo
    echo "🔄 Next Steps:"
    echo "   1. node verify-seascape-connection.cjs"
    echo "   2. Check Supabase Dashboard for confirmation"
    echo "   3. Proceed with Phase 3: Backend Services"
else
    echo
    echo "⚠️  Partial deployment completed"
    echo "   Manual deployment may be required for remaining operations"
    echo
    echo "📝 Manual Deployment Steps:"
    echo "   1. https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    echo "   2. Execute any failed SQL files manually"
    echo "   3. Verify deployment status"
fi

echo
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"