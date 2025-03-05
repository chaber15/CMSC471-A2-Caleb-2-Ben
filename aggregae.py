import pandas as pd

# Load the dataset
df = pd.read_csv("A2\data\Chicago Crimes 2014-2024.csv")

# Convert 'Date' to datetime format
df['Date'] = pd.to_datetime(df['Date'])

# Extract Year and Month
df['YearMonth'] = df['Date'].dt.to_period('M')

# Define crime types to exclude
excluded_crimes = [
    "INTIMIDATION", 
    "KIDNAPPING", 
    "NON-CRIMINAL", 
    "CONCEALED CARRY LICENSE VIOLATION", 
    "GAMBLING", 
    "PUBLIC INDECENCY", 
    "OBSCENITY",
    "POLICE INTERFERENCE",
    "PUBLIC PEACE VIOLATION",
    "WEAPONS VIOLATION",
    "INTERFERENCE WITH PUBLIC OFFICER",
    "NON - CRIMINAL",
    "LIQUOR LAW VIOLATION"
]

# Filter out excluded crime types
filtered_df = df[~df['Primary Type'].isin(excluded_crimes)]

# Replace crime names with the new names
filtered_df['Primary Type'] = filtered_df['Primary Type'].replace({
    "CRIMINAL DAMAGE": "VANDALISM",
    "CRIMINAL TRESPASS": "TRESPASSING",
    "MOTOR VEHICLE THEFT": "VEHICLE THEFT",
    "OTHER OFFENSE": "OTHER" 
})

# Aggregate by Year-Month and Crime Type
aggregated_data = filtered_df.groupby(['YearMonth', 'Primary Type']).size().reset_index(name='Count')

# Save to a new CSV
aggregated_data.to_csv("aggregated_crime_data_monthly.csv", index=False)

print("Aggregation complete! Unwanted crimes removed and names updated. Saved as 'aggregated_crime_data_monthly.csv'")
