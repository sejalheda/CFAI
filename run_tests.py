import unittest
import sys

if __name__ == '__main__':
    # Discover and run tests in the 'tests' directory
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir='tests')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with non-zero exit code if any tests failed
    if not result.wasSuccessful():
        sys.exit(1)
