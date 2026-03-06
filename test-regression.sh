#!/bin/bash

# WatchHive - Automated Regression Test Suite
# This script runs automated API tests for pre-release validation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TEST_EMAIL="autotest_$(date +%s)@watchhive.com"
TEST_USERNAME="autotest_$(date +%s)"
TEST_PASSWORD="AutoTest123"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a FAILED_TEST_NAMES

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Error: $2${NC}"
    ((FAILED_TESTS++))
    FAILED_TEST_NAMES+=("$1")
}

# Test functions
test_health_check() {
    print_test "TC-API-005: Health Check"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "ok"; then
            print_pass "Health check endpoint responding"
        else
            print_fail "Health check endpoint" "Invalid response body"
        fi
    else
        print_fail "Health check endpoint" "HTTP $http_code"
    fi
}

test_user_registration() {
    print_test "TC-API-001: User Registration"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TEST_USERNAME\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        if echo "$body" | grep -q "accessToken"; then
            # Extract tokens for later use
            export ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
            export REFRESH_TOKEN=$(echo "$body" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
            print_pass "User registration successful"
        else
            print_fail "User registration" "No access token in response"
        fi
    else
        print_fail "User registration" "HTTP $http_code - $body"
    fi
}

test_duplicate_username() {
    print_test "TC-AUTH-002: Duplicate Username Validation"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$TEST_USERNAME\",
            \"email\": \"different_$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "409" ]; then
        print_pass "Duplicate username rejected"
    else
        print_fail "Duplicate username validation" "Expected 400/409, got HTTP $http_code"
    fi
}

test_duplicate_email() {
    print_test "TC-AUTH-003: Duplicate Email Validation"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"different_$TEST_USERNAME\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "409" ]; then
        print_pass "Duplicate email rejected"
    else
        print_fail "Duplicate email validation" "Expected 400/409, got HTTP $http_code"
    fi
}

test_weak_password() {
    print_test "TC-AUTH-004: Weak Password Validation"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"weakpass_$TEST_USERNAME\",
            \"email\": \"weakpass_$TEST_EMAIL\",
            \"password\": \"weak\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "400" ]; then
        print_pass "Weak password rejected"
    else
        print_fail "Weak password validation" "Expected 400, got HTTP $http_code"
    fi
}

test_invalid_email() {
    print_test "TC-AUTH-005: Invalid Email Validation"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"invalidemail_$TEST_USERNAME\",
            \"email\": \"notanemail\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "400" ]; then
        print_pass "Invalid email rejected"
    else
        print_fail "Invalid email validation" "Expected 400, got HTTP $http_code"
    fi
}

test_user_login() {
    print_test "TC-API-002: User Login"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "accessToken"; then
            print_pass "User login successful"
        else
            print_fail "User login" "No access token in response"
        fi
    else
        print_fail "User login" "HTTP $http_code"
    fi
}

test_invalid_login() {
    print_test "TC-AUTH-007: Invalid Login Credentials"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"WrongPassword123\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "401" ]; then
        print_pass "Invalid credentials rejected"
    else
        print_fail "Invalid login validation" "Expected 401, got HTTP $http_code"
    fi
}

test_token_refresh() {
    print_test "TC-API-003: Token Refresh"
    ((TOTAL_TESTS++))
    
    if [ -z "$REFRESH_TOKEN" ]; then
        print_fail "Token refresh" "No refresh token available (registration may have failed)"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{
            \"refreshToken\": \"$REFRESH_TOKEN\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "accessToken"; then
            print_pass "Token refresh successful"
        else
            print_fail "Token refresh" "No access token in response"
        fi
    else
        print_fail "Token refresh" "HTTP $http_code"
    fi
}

test_logout() {
    print_test "TC-API-004: User Logout"
    ((TOTAL_TESTS++))
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "User logout" "No access token available"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "200" ]; then
        print_pass "User logout successful"
    else
        print_fail "User logout" "HTTP $http_code"
    fi
}

test_sql_injection() {
    print_test "TC-SEC-001: SQL Injection Prevention"
    ((TOTAL_TESTS++))
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"' OR '1'='1' --\",
            \"password\": \"anything\"
        }")
    
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
        print_pass "SQL injection prevented"
    else
        print_fail "SQL injection prevention" "Unexpected response: HTTP $http_code"
    fi
}

# Main test execution
main() {
    print_header "WatchHive Automated Regression Tests"
    echo "API URL: $API_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Test User: $TEST_USERNAME"
    echo "Test Email: $TEST_EMAIL"
    echo ""
    
    # Check if servers are running
    print_header "Pre-flight Checks"
    
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}✗ Backend server is not running at $API_URL${NC}"
        echo "Please start the backend server: cd server && npm run dev"
        exit 1
    fi
    echo -e "${GREEN}✓ Backend server is running${NC}"
    
    if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Frontend server is not running at $FRONTEND_URL${NC}"
        echo "  (Frontend tests will be skipped)"
    else
        echo -e "${GREEN}✓ Frontend server is running${NC}"
    fi
    
    echo ""
    
    # Run tests
    print_header "Running API Tests"
    
    test_health_check
    test_user_registration
    test_duplicate_username
    test_duplicate_email
    test_weak_password
    test_invalid_email
    test_user_login
    test_invalid_login
    test_token_refresh
    test_logout
    test_sql_injection
    
    # Summary
    echo ""
    print_header "Test Summary"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TEST_NAMES[@]}"; do
            echo -e "${RED}  - $test${NC}"
        done
    fi
    
    echo ""
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Pass Rate: $PASS_RATE%"
    
    if [ $PASS_RATE -ge 95 ]; then
        echo -e "${GREEN}✓ Test suite PASSED (≥95% pass rate)${NC}"
        exit 0
    elif [ $PASS_RATE -ge 80 ]; then
        echo -e "${YELLOW}⚠ Test suite PASSED with warnings (80-94% pass rate)${NC}"
        exit 0
    else
        echo -e "${RED}✗ Test suite FAILED (<80% pass rate)${NC}"
        exit 1
    fi
}

# Run main function
main
