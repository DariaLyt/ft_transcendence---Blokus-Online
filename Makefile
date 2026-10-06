all: ensure-env ensure-certs
	docker compose up --build -d

up: ensure-env ensure-certs
	docker compose up --build -d

ensure-env:
	@test -f .env || cp .env.example .env

ensure-certs:
	@test -f backend/certs/key.pem -a -f backend/certs/cert.pem || $(MAKE) certs

down:
	docker compose down

clean:
	docker compose down -v --rmi all --remove-orphans

fclean: clean
	docker system prune -af

logs:
	docker compose logs

status:
	docker compose ps

certs:
	mkdir -p backend/certs && openssl req -x509 -newkey rsa:2048 -nodes \
		-keyout backend/certs/key.pem \
		-out backend/certs/cert.pem \
		-days 365 \
		-subj "/CN=localhost"

re: fclean all

.PHONY: all up ensure-env ensure-certs down clean fclean logs status certs re
