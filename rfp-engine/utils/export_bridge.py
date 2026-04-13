import sys
import json
import os

# Ensure the script can find exporter.py in its own directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from exporter import SovereignExporter

def main():
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            return
            
        data = json.loads(input_data)
        
        # Initialize exporter
        exporter = SovereignExporter()
        
        # Generate RTM
        binary_data = exporter.generate_rtm(data)
        
        # Write to stdout as binary
        sys.stdout.buffer.write(binary_data)
        
    except Exception as e:
        sys.stderr.write(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
