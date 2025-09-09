import os
import json
import sys
from bs4 import BeautifulSoup

def update_problem_json(json_path, html_path):
    """
    Parses an HTML file to extract correct sample tests and updates the corresponding JSON file.

    Args:
        json_path (str): The path to the problem's JSON file.
        html_path (str): The path to the problem's HTML file.

    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        # Step 1: Read and parse the HTML file
        with open(html_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Step 2: Find all sample test blocks in the HTML
        sample_blocks = soup.find_all('div', class_='sample-test')
        if not sample_blocks:
            print(f"⚠️  Warning: No sample tests found in {os.path.basename(html_path)}")
            return False

        new_sample_tests = []
        
        # Step 3: Process each sample block to extract input and output
        for block in sample_blocks:
            input_div = block.find('div', class_='input')
            output_div = block.find('div', class_='output')

            if not input_div or not output_div or not input_div.pre or not output_div.pre:
                print(f"⚠️  Warning: Incomplete sample block in {os.path.basename(html_path)}")
                continue

            # For input, Codeforces often wraps each line in a <div>
            input_line_divs = input_div.pre.find_all('div')
            if input_line_divs:
                correct_input = '\n'.join(div.get_text() for div in input_line_divs)
            else:
                # Fallback if the input is not wrapped in line-by-line divs
                correct_input = input_div.pre.get_text()

            # For output, the text is usually plain inside the <pre> tag
            correct_output = output_div.pre.get_text().strip()

            new_sample_tests.append({
                'input': correct_input.strip(),
                'output': correct_output
            })

        if not new_sample_tests:
            print(f"⚠️  Warning: Could not extract any valid samples from {os.path.basename(html_path)}")
            return False
            
        # Step 4: Read the existing JSON data
        with open(json_path, 'r', encoding='utf-8') as f:
            problem_data = json.load(f)

        # Step 5: Update the 'sampleTests' key and write back to the file
        problem_data['sampleTests'] = new_sample_tests
        with open(json_path, 'w', encoding='utf-8') as f:
            # indent=2 makes the JSON file human-readable
            json.dump(problem_data, f, indent=2, ensure_ascii=False)
            
        return True

    except FileNotFoundError:
        # This case is handled in the main loop, but serves as a safeguard
        print(f"❌ Error: HTML file not found for {os.path.basename(json_path)}")
        return False
    except Exception as e:
        print(f"❌ An unexpected error occurred while processing {os.path.basename(json_path)}: {e}")
        return False

def process_directories(json_dir, html_dir):
    """
    Finds all JSON files in json_dir, finds their corresponding HTML files in html_dir, and updates them.
    """
    # Validate directory paths
    if not os.path.isdir(json_dir):
        print(f"❌ Error: The JSON directory '{json_dir}' does not exist.")
        return
    if not os.path.isdir(html_dir):
        print(f"❌ Error: The HTML directory '{html_dir}' does not exist.")
        return

    print(f"🚀 Starting to process files...")
    print(f"   JSON folder: '{json_dir}'")
    print(f"   HTML folder: '{html_dir}'")
    
    json_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
    
    if not json_files:
        print("No JSON files found in the specified directory.")
        return

    success_count = 0
    total_count = len(json_files)

    for json_filename in json_files:
        base_name = os.path.splitext(json_filename)[0]
        
        # Construct full paths for the JSON and corresponding HTML file
        json_path = os.path.join(json_dir, json_filename)
        html_path = os.path.join(html_dir, f"{base_name}.html")

        if os.path.exists(html_path):
            if update_problem_json(json_path, html_path):
                print(f"✅ Successfully updated {json_filename}")
                success_count += 1
        else:
            print(f"⏭️  Skipping {json_filename}, corresponding HTML file not found in HTML folder.")
            
    print("\n---")
    print(f"🎉 Processing complete! Updated {success_count} out of {total_count} files.")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("\nUsage: python update_samples.py <path_to_json_folder> <path_to_html_folder>\n")
        print("Example: python update_samples.py ./extracted_problems ./problems\n")
        sys.exit(1)
        
    json_folder = sys.argv[1]
    html_folder = sys.argv[2]
    process_directories(json_folder, html_folder)