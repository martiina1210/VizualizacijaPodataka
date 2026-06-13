import csv
import json

print("Učitavanje CSV datoteke...")

with open('lol_champions.csv', encoding='utf-8-sig', errors='replace') as f:
    content = f.read()

rows = content.strip().split('\n')
headers = rows[0].split(';')
print(f"  Pronađeno stupaca: {len(headers)}")
print(f"  Pronađeno championа: {len(rows) - 1}")

print("\nParsiranje podataka...")

raw_champions = []
for row in rows[1:]:
    fields = row.split(';')
    if len(fields) < 5:
        continue
    champ = {}
    for i, h in enumerate(headers):
        champ[h] = fields[i] if i < len(fields) else ''
    raw_champions.append(champ)


print("\nKorekcija ID-eva za Data Dragon API...")

ID_FIX = {
    'Ksante':      'KSante',      
    'RenataGlasc': 'Renata',      
    'MonkeyKing':  'MonkeyKing',  
    'DrMundo':     'DrMundo',
    'JarvanIV':    'JarvanIV',
    'KogMaw':      'KogMaw',
    'LeeSin':      'LeeSin',
    'MasterYi':    'MasterYi',
    'MissFortune': 'MissFortune',
    'RekSai':      'RekSai',
    'TahmKench':   'TahmKench',
    'TwistedFate': 'TwistedFate',
    'XinZhao':     'XinZhao',
    'AurelionSol': 'AurelionSol',
    'Chogath':     'Chogath',
    'Khazix':      'Khazix',
    'Kaisa':       'Kaisa',
    'Belveth':     'Belveth',
    'Leblanc':     'Leblanc',
}


DDV = "14.24.1"
BASE_URL = f"https://ddragon.leagueoflegends.com/cdn/{DDV}/img/champion/"

print("Čišćenje i pretvorba podataka...")

champions_output = []
errors = 0

for c in raw_champions:
    try:
        
        kda = c.get('averageKDA', '0/0/0')
        kda_parts = kda.split('/')
        kills   = float(kda_parts[0]) if len(kda_parts) > 0 else 0
        deaths  = float(kda_parts[1]) if len(kda_parts) > 1 else 1
        assists = float(kda_parts[2]) if len(kda_parts) > 2 else 0

        
        winrate    = float(c.get('winrate',    '0').replace('%', ''))
        banrate    = float(c.get('banrate',    '0').replace('%', ''))
        popularity = float(c.get('popularity', '0').replace('%', ''))

        roles_raw = c.get('role', '')
        roles = [r.strip() for r in roles_raw.split(',') if r.strip()]

        tags_raw = c.get('tags', '')
        tags = [t.strip() for t in tags_raw.split(',') if t.strip()]

        champ_id = c.get('id', '')
        corrected_id = ID_FIX.get(champ_id, champ_id)
        img_url = BASE_URL + corrected_id + ".png"

        if corrected_id != champ_id:
            print(f"  ID korigiran: {champ_id} → {corrected_id}")

        champ_out = {
            'id':          champ_id,
            'key':         c.get('key', ''),
            'name':        c.get('name', ''),
            'title':       c.get('title', ''),
            'roles':       roles,
            'primaryRole': roles[0] if roles else '',
            'tags':        tags,
            'rangetype':   c.get('rangetype', ''),
            # Numeričke statistike (pretvorene iz stringa)
            'winrate':     winrate,
            'banrate':     banrate,
            'popularity':  popularity,
            'kills':       kills,
            'deaths':      deaths,
            'assists':     assists,
            # Ocjene (0-10)
            'attack':     int(c.get('attack',     '0') or 0),
            'defense':    int(c.get('defense',    '0') or 0),
            'magic':      int(c.get('magic',      '0') or 0),
            'difficulty': int(c.get('difficulty', '0') or 0),
            # Bazne statistike
            'hp':          float(c.get('hp',          '0') or 0),
            'movespeed':   float(c.get('movespeed',   '0') or 0),
            'attackrange': float(c.get('attackrange', '0') or 0),
            'armor':       float(c.get('armor',       '0') or 0),
            'attackdamage':float(c.get('attackdamage','0') or 0),
            'attackspeed': float(c.get('attackspeed', '0') or 0),
            # Ostalo
            'releasedate': c.get('releasedate', ''),
            'blurb':       c.get('blurb', '')[:200],
            'spell1_name': c.get('spell1_name', ''),
            'spell2_name': c.get('spell2_name', ''),
            'spell3_name': c.get('spell3_name', ''),
            'ulti_name':   c.get('ulti_name',   ''),
            'imgUrl':      img_url,
        }
        champions_output.append(champ_out)

    except Exception as e:
        print(f"  GREŠKA kod {c.get('name','?')}: {e}")
        errors += 1


print(f"\nIzvoz u JSON...")

with open('champions_data.json', 'w', encoding='utf-8') as f:
    json.dump(champions_output, f, ensure_ascii=False, indent=2)

print(f"\n✓ Obrada završena!")
print(f"  Obrađeno championа: {len(champions_output)}")
print(f"  Greške: {errors}")
print(f"  Izlazna datoteka: champions_data.json")
print(f"  Data Dragon verzija: {DDV}")
