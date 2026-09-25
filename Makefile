all:
	docker compose up --build

up:
	docker compose up --build

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

.PHONY: all up down clean fclean logs status certs re
