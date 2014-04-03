test:
	@mocha tests/ -R spec

test-cov:
	@mocha tests/ --require blanket -R html-cov > tests/covrage.html

coveralls:
	@mocha tests/ --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
